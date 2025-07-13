// This function sets the current business ID for the database session.
// This is a critical part of the multi-tenant security model.
export const setCurrentBusinessId = async (client, businessId) => {
    await client.query(`SET app.current_business_id = '${businessId}'`);
};
// Basic SQL injection protection. In a real application, you should use
// parameterized queries, but this provides a basic level of protection.
export const validateSqlQuery = (sql) => {
    const trimmedSql = sql.trim().toLowerCase();
    if (!trimmedSql) {
        return { isValid: false, error: 'SQL query cannot be empty' };
    }
    const dangerousPatterns = [
        /;\s*drop\s+/i,
        /^drop\s+/i,
        /;\s*delete\s+.*\s+where\s+1\s*=\s*1/i,
        /;\s*update\s+.*\s+set\s+.*\s+where\s+1\s*=\s*1/i,
        /;\s*truncate\s+/i,
        /^truncate\s+/i,
        /;\s*alter\s+/i,
        /^alter\s+/i,
        /;\s*create\s+/i,
        /;\s*grant\s+/i,
        /;\s*revoke\s+/i,
        /xp_cmdshell/i,
        /sp_executesql/i
    ];
    for (const pattern of dangerousPatterns) {
        if (pattern.test(sql)) {
            return { isValid: false, error: 'Query contains potentially dangerous SQL patterns' };
        }
    }
    return { isValid: true };
};
export const isWriteOperation = (sql) => {
    const trimmedSql = sql.trim().toLowerCase();
    const writeKeywords = [
        'insert',
        'update',
        'delete',
        'create',
        'drop',
        'alter',
        'truncate',
        'grant',
        'revoke',
        'commit',
        'rollback'
    ];
    return writeKeywords.some((keyword) => trimmedSql.startsWith(keyword));
};
export const formatDatabaseError = (error) => {
    if (error instanceof Error) {
        if (error.message.includes('password')) {
            return 'Database authentication failed. Please check your credentials.';
        }
        if (error.message.includes('timeout')) {
            return 'Database connection timed out. Please try again.';
        }
        if (error.message.includes('connection') || error.message.includes('connect')) {
            return 'Unable to connect to database. Please check your connection string.';
        }
        return `Database error: ${error.message}`;
    }
    return 'An unknown database error occurred.';
};
