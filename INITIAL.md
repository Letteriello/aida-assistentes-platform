# AIDA - Context Engineering Blueprint

## 1. Visão Geral do Projeto (Core Context)

Este documento serve como o **blueprint de engenharia de contexto** para o desenvolvimento da plataforma AIDA (Assistente de Inteligência Artificial Dinâmico e Adaptativo). O objetivo é fornecer ao agente de IA todo o contexto necessário para gerar código, tomar decisões de arquitetura e manter a coerência do projeto de forma autônoma e eficiente.

### 1.1. Objetivo Principal

- **O que é?** Criar uma plataforma SaaS para que usuários leigos possam construir e gerenciar assistentes de IA avançados para WhatsApp.
- **Para quem?** Empresas e negócios que desejam automatizar o atendimento ao cliente de forma personalizada e inteligente.
- **Como?** Através de uma interface intuitiva que abstrai a complexidade da engenharia de prompt, utilizando formulários e um agente de IA auxiliar para guiar o usuário.

### 1.2. Pilares Tecnológicos

- **Comunicação:** Integração com o WhatsApp via **Evolution API**.
- **Frontend & UI/UX:** **Next.js**, **Shadcn/UI**, **Tailwind CSS** e **TypeScript** para uma interface moderna, funcional e esteticamente agradável.
- **Backend & Persistência:** Arquitetura Serverless com **Supabase**, utilizando PostgreSQL para dados relacionais e a extensão **pgvector** para embeddings.
- **Inteligência Artificial:**
  - **RAG Híbrido:** Combinação de busca vetorial (pgvector) com grafos de conhecimento (tecnologia a ser definida, ex: Neo4j, GraphRag) para recuperação de contexto rica e precisa.
  - **Orquestração:** Uso de frameworks como **LangChain** para gerenciar os fluxos de IA.

### 1.3. Arquitetura da Memória (Dual-Memory System)

O sistema de memória é o coração do AIDA e se divide em duas camadas:

1.  **Memória de Negócio (Grafo de Conhecimento):**
    - **Propósito:** Armazenar o conhecimento estático e dinâmico da empresa cliente (produtos, serviços, políticas, estoque via API, etc.).
    - **Tecnologia:** Grafo de conhecimento para representar entidades e suas relações, permitindo inferências complexas.
    - **Evolução:** O grafo é continuamente enriquecido para que o assistente ganhe domínio sobre o negócio.

2.  **Memória de Conversa (Relacional + Vetorial):**
    - **Propósito:** Rastrear o histórico de interações de cada cliente final.
    - **Identificação:** Utilizar o `remoteJid` da Evolution API como ID único para cada conversa/cliente.
    - **Tecnologia:** Banco de dados relacional para o histórico e busca vetorial para encontrar interações semanticamente similares.

### 1.4. Design System & Filosofia de UX

- **Inspiração:** O design deve evocar os conceitos de fluidez, elegância, realeza e prosperidade, inspirados na simbologia do Orixá Oxum, mas sem referências religiosas diretas.
- **Princípios:** Interface limpa, minimalista, intuitiva e funcional, projetada para ser compreendida por usuários sem conhecimento técnico.

---

## 2. Exemplos Práticos (Implementation Guidance)

Esta seção fornece exemplos de código que servem como guias de implementação e referência de padrões. O agente deve usar estes exemplos como inspiração, adaptando-os ao contexto específico da tarefa, e não como código a ser copiado diretamente.

- **`examples/evolution-api-client/`**: Módulo de exemplo para conexão e troca de mensagens com a **Evolution API**.
- **`examples/ui-design-system/`**: Componentes base em **Next.js** e **Shadcn/UI** que refletem a estética do projeto.
- **`examples/hybrid-rag-query.ts`**: Script demonstrando uma consulta híbrida (vetorial + grafo).

## 3. Fontes de Conhecimento Externo (External Context)

O agente deve consultar estas documentações para garantir o uso correto das tecnologias e APIs, mantendo o código atualizado com as melhores práticas.

- **APIs e Integrações:**
  - [Evolution API](https://doc.evolution-api.com/)
  - [Supabase](https://supabase.com/docs) (incluindo [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector))
- **Frontend e UI/UX:**
  - [Next.js](https://nextjs.org/docs)
  - [Shadcn/UI](https://ui.shadcn.com/)
  - [Tailwind CSS](https://tailwindcss.com/docs)
  - [TypeScript](https://www.typescriptlang.org/docs/)
- **RAG Híbrido e Grafos:**
  - [GraphRag](https://github.com/microsoft/graphrag)
  - [Neo4j](https://neo4j.com/developer/get-started/)
  - [LangChain](https://python.langchain.com/v0.2/docs/integrations/graphs/neo4j_cypher/)
- **Conceitos e Arquitetura:**
  - Guias sobre **Clean Architecture** com TypeScript.
  - Artigos sobre **Sistemas de RAG Híbrido**.

## 4. Considerações Estratégicas (Strategic Context)

Esta seção contém diretrizes de alto nível e requisitos não-funcionais que devem guiar as decisões de implementação do agente.

- **Setup e README:** O `README.md` deve ser abrangente, com um `.env.example` claro e instruções detalhadas de setup.
- **Design System:** Um guia de estilo visual inicial é necessário para garantir a consistência da UI/UX.
- **Modelagem de Dados:** O design do schema relacional e da estrutura do grafo deve ser priorizado antes da implementação.
- **Segurança e Multi-Tenancy:** A segurança e o isolamento de dados do cliente são críticos. A implementação de RLS e criptografia é obrigatória.
