import { SupabaseClient } from '@supabase/supabase-js';
import { Driver as Neo4jDriver } from 'neo4j-driver';
import { OpenAI } from 'openai';

export interface RetrievalResult {
  documents: RetrievalDocument[];
  entities: RetrievalEntity[];
  confidence: number;
  sources: string[];
}

export interface RetrievalDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  source: 'vector' | 'graph' | 'hybrid';
}

export interface RetrievalEntity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  relationships: EntityRelationship[];
}

export interface EntityRelationship {
  target: string;
  type: string;
  properties?: Record<string, any>;
}

export class RAGEngineV2 {
  private supabase: SupabaseClient;
  private neo4j: Neo4jDriver;
  private openai: OpenAI;
  private cache = new Map<string, RetrievalResult>();
  
  constructor(supabase: SupabaseClient, neo4j: Neo4jDriver) {
    this.supabase = supabase;
    this.neo4j = neo4j;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }

  async hybridRetrieval(
    query: string, 
    businessId: string,
    options: {
      maxResults?: number;
      threshold?: number;
      useCache?: boolean;
      enableGraphExpansion?: boolean;
    } = {}
  ): Promise<RetrievalResult> {
    const {
      maxResults = 10,
      threshold = 0.7,
      useCache = true,
      enableGraphExpansion = true
    } = options;

    // Cache check
    const cacheKey = `${businessId}:${query}:${JSON.stringify(options)}`;
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Stage 1: Semantic Search (PgVector)
    const vectorResults = await this.vectorSearch(query, businessId, {
      limit: maxResults * 2,
      threshold
    });

    // Stage 2: Graph Expansion (Neo4j)
    let graphResults: RetrievalEntity[] = [];
    if (enableGraphExpansion && vectorResults.entities.length > 0) {
      graphResults = await this.graphExpansion(vectorResults.entities, {
        maxHops: 2,
        relationshipTypes: ['RELATED_TO', 'CONTAINS', 'MENTIONS', 'PART_OF']
      });
    }

    // Stage 3: Hybrid Reranking
    const rerankedResults = await this.hybridRerank(
      [...vectorResults.documents],
      query,
      businessId
    );

    // Stage 4: Context Assembly
    const finalResult = await this.assembleContext(rerankedResults, graphResults, {
      maxResults,
      prioritizeRecent: true,
      includeMetadata: true
    });

    // Cache result
    if (useCache) {
      this.cache.set(cacheKey, finalResult);
      // Auto-expire after 1 hour
      setTimeout(() => this.cache.delete(cacheKey), 3600000);
    }

    return finalResult;
  }

  private async vectorSearch(
    query: string, 
    businessId: string,
    options: { limit: number; threshold: number }
  ): Promise<{ documents: RetrievalDocument[]; entities: RetrievalEntity[] }> {
    // Generate embedding for query
    const embedding = await this.generateEmbedding(query);
    
    // Search documents
    const { data: documents } = await this.supabase
      .from('documents')
      .select(`
        id,
        content,
        metadata,
        embedding <-> '[${embedding.join(',')}]' as similarity
      `)
      .eq('business_id', businessId)
      .lt('embedding <-> `[${embedding.join(',')}]`', 1 - options.threshold)
      .order('similarity')
      .limit(options.limit);

    // Search knowledge entities  
    const { data: entities } = await this.supabase
      .from('knowledge_entities')
      .select(`
        id,
        name,
        type,
        properties,
        embedding <-> '[${embedding.join(',')}]' as similarity
      `)
      .eq('business_id', businessId)
      .lt('embedding <-> `[${embedding.join(',')}]`', 1 - options.threshold)
      .order('similarity')
      .limit(options.limit);

    return {
      documents: documents?.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata || {},
        score: 1 - doc.similarity,
        source: 'vector' as const
      })) || [],
      entities: entities?.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        properties: entity.properties || {},
        relationships: [] // Will be filled by graph expansion
      })) || []
    };
  }

  private async graphExpansion(
    entities: RetrievalEntity[],
    options: { maxHops: number; relationshipTypes: string[] }
  ): Promise<RetrievalEntity[]> {
    if (entities.length === 0) return [];

    const session = this.neo4j.session();
    
    try {
      const entityIds = entities.map(e => e.id);
      const relationshipTypes = options.relationshipTypes.map(type => `'${type}'`).join(', ');
      
      const query = `
        MATCH (start:Entity)
        WHERE start.id IN $entityIds
        CALL apoc.path.expand(start, ">${relationshipTypes}", "+Entity", 1, ${options.maxHops})
        YIELD path
        WITH start, nodes(path) as pathNodes, relationships(path) as pathRels
        UNWIND pathNodes as node
        WITH DISTINCT node, 
             [rel in pathRels WHERE startNode(rel).id = node.id | {
               target: endNode(rel).id,
               type: type(rel),
               properties: properties(rel)
             }] as relationships
        RETURN node.id as id,
               node.name as name, 
               node.type as type,
               properties(node) as properties,
               relationships
      `;
      
      const result = await session.run(query, { entityIds });
      
      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        type: record.get('type'),
        properties: record.get('properties') || {},
        relationships: record.get('relationships') || []
      }));
      
    } finally {
      await session.close();
    }
  }

  private async hybridRerank(
    documents: RetrievalDocument[],
    query: string,
    businessId: string
  ): Promise<RetrievalDocument[]> {
    // Combine vector similarity with BM25 and business-specific scoring
    
    // BM25 scoring
    const bm25Scores = await this.calculateBM25Scores(documents, query, businessId);
    
    // Cross-encoder reranking for top candidates
    const topCandidates = documents.slice(0, Math.min(20, documents.length));
    const crossEncoderScores = await this.crossEncoderRerank(topCandidates, query);
    
    // Hybrid scoring
    const rerankedDocs = documents.map((doc, index) => {
      const bm25Score = bm25Scores[index] || 0;
      const crossScore = crossEncoderScores[index] || 0;
      const vectorScore = doc.score;
      
      // Weighted combination
      const hybridScore = (vectorScore * 0.4) + (bm25Score * 0.3) + (crossScore * 0.3);
      
      return {
        ...doc,
        score: hybridScore,
        source: 'hybrid' as const
      };
    });
    
    // Sort by hybrid score
    return rerankedDocs.sort((a, b) => b.score - a.score);
  }

  private async calculateBM25Scores(
    documents: RetrievalDocument[],
    query: string,
    businessId: string
  ): Promise<number[]> {
    // Simplified BM25 implementation
    const queryTerms = query.toLowerCase().split(/\s+/);
    const k1 = 1.2;
    const b = 0.75;
    
    // Get average document length for business
    const { data: avgLengthResult } = await this.supabase
      .from('documents')
      .select('content')
      .eq('business_id', businessId);
    
    const avgDocLength = avgLengthResult
      ? avgLengthResult.reduce((sum, doc) => sum + doc.content.length, 0) / avgLengthResult.length
      : 1000;
    
    return documents.map(doc => {
      const docTerms = doc.content.toLowerCase().split(/\s+/);
      const docLength = docTerms.length;
      
      let score = 0;
      for (const term of queryTerms) {
        const tf = docTerms.filter(t => t === term).length;
        if (tf > 0) {
          const idf = Math.log((documents.length + 1) / (documents.filter(d => 
            d.content.toLowerCase().includes(term)
          ).length + 1));
          
          score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
        }
      }
      
      return score;
    });
  }

  private async crossEncoderRerank(
    documents: RetrievalDocument[],
    query: string
  ): Promise<number[]> {
    // Use a lightweight cross-encoder model or API
    // For now, use OpenAI to score relevance
    try {
      const scores = await Promise.all(
        documents.map(async (doc) => {
          const prompt = `
            Score the relevance of this document to the query on a scale of 0-1:
            
            Query: "${query}"
            Document: "${doc.content.substring(0, 500)}..."
            
            Return only a number between 0 and 1:
          `;
          
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10,
            temperature: 0
          });
          
          const scoreText = response.choices[0].message.content?.trim() || '0';
          return parseFloat(scoreText) || 0;
        })
      );
      
      return scores;
    } catch (error) {
      console.error('Cross-encoder reranking failed:', error);
      return documents.map(() => 0);
    }
  }

  private async assembleContext(
    documents: RetrievalDocument[],
    entities: RetrievalEntity[],
    options: {
      maxResults: number;
      prioritizeRecent: boolean;
      includeMetadata: boolean;
    }
  ): Promise<RetrievalResult> {
    // Sort and limit results
    const sortedDocs = documents
      .sort((a, b) => {
        if (options.prioritizeRecent && a.metadata.created_at && b.metadata.created_at) {
          const timeScore = new Date(b.metadata.created_at).getTime() - new Date(a.metadata.created_at).getTime();
          return (b.score - a.score) + (timeScore / 1000000000); // Combine relevance and recency
        }
        return b.score - a.score;
      })
      .slice(0, options.maxResults);
    
    // Calculate overall confidence
    const confidence = sortedDocs.length > 0
      ? sortedDocs.reduce((sum, doc) => sum + doc.score, 0) / sortedDocs.length
      : 0;
    
    // Extract sources
    const sources = Array.from(new Set(
      sortedDocs.map(doc => doc.metadata.source || doc.source)
    ));
    
    return {
      documents: sortedDocs,
      entities,
      confidence,
      sources
    };
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  }
}