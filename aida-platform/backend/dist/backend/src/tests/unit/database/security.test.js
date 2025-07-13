/**
 * AIDA Platform - Database Security Tests
 * Unit tests for multi-tenant security and validation
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, extractBusinessIdFromContext, getSecurityHeaders, logSecurityEvent, sanitizeInput, validateApiKey, validateAssistantAccess, validateBusinessAccess, validateConversationAccess, validateInput, validateWhatsAppJID } from '../../../database/security';
describe('Database Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('validateInput', () => {
        it('should validate safe strings', () => {
            const safeInputs = [
                'Hello world',
                'user@example.com',
                'Product name 123',
                'São Paulo, Brasil',
                'Normal conversation text with punctuation!'
            ];
            safeInputs.forEach(input => {
                expect(() => validateInput(input, 'test_field')).not.toThrow();
            });
        });
        it('should reject SQL injection attempts', () => {
            const maliciousInputs = [
                '\'; DROP TABLE users; --',
                '1\' OR \'1\'=\'1',
                'admin\'--',
                '1; DELETE FROM conversations;',
                'UNION SELECT * FROM business_secrets',
                '\' UNION SELECT password FROM users --'
            ];
            maliciousInputs.forEach(input => {
                expect(() => validateInput(input, 'test_field')).toThrow('Invalid input detected');
            });
        });
        it('should reject XSS attempts', () => {
            const xssInputs = [
                '<script>alert("xss")</script>',
                'javascript:alert(1)',
                '<img src=x onerror=alert(1)>',
                '<svg onload=alert(1)>',
                '"><script>alert(1)</script>'
            ];
            xssInputs.forEach(input => {
                expect(() => validateInput(input, 'test_field')).toThrow('Invalid input detected');
            });
        });
        it('should validate input length limits', () => {
            const longInput = 'a'.repeat(10001); // Exceeds max length
            expect(() => validateInput(longInput, 'test_field')).toThrow('Input too long');
        });
        it('should handle special WhatsApp content patterns', () => {
            const whatsAppInputs = [
                '5511999999999@s.whatsapp.net',
                'Message with emojis 😊🎉',
                'WhatsApp message\nwith line breaks',
                'Quoted message: "Hello world"',
                'Phone number: +55 11 99999-9999'
            ];
            whatsAppInputs.forEach(input => {
                expect(() => validateInput(input, 'whatsapp_content')).not.toThrow();
            });
        });
    });
    describe('sanitizeInput', () => {
        it('should sanitize potentially dangerous characters', () => {
            const testCases = [
                {
                    input: '<script>alert("test")</script>',
                    expected: '&lt;script&gt;alert("test")&lt;/script&gt;'
                },
                {
                    input: '\'; DROP TABLE users; --',
                    expected: '&#x27;; DROP TABLE users; --'
                },
                {
                    input: 'Normal text with "quotes" and \'apostrophes\'',
                    expected: 'Normal text with "quotes" and &#x27;apostrophes&#x27;'
                }
            ];
            testCases.forEach(({ input, expected }) => {
                const result = sanitizeInput(input);
                expect(result).toBe(expected);
            });
        });
        it('should preserve safe content', () => {
            const safeInputs = [
                'Hello world',
                'Product description with numbers 123',
                'Email: user@example.com',
                'WhatsApp JID: 5511999999999@s.whatsapp.net'
            ];
            safeInputs.forEach(input => {
                const result = sanitizeInput(input);
                expect(result).not.toContain('<script>');
                expect(result).not.toContain('javascript:');
            });
        });
    });
    describe('validateBusinessAccess', () => {
        it('should validate legitimate business access', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'business-123',
                                    name: 'Test Business',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateBusinessAccess('business-123', 'user-456', mockSupabase);
            expect(isValid).toBe(true);
        });
        it('should reject access to non-existent business', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Business not found' }
                            })
                        })
                    })
                })
            };
            const isValid = await validateBusinessAccess('nonexistent-business', 'user-456', mockSupabase);
            expect(isValid).toBe(false);
        });
        it('should reject access to inactive business', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'business-123',
                                    name: 'Inactive Business',
                                    status: 'suspended'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateBusinessAccess('business-123', 'user-456', mockSupabase);
            expect(isValid).toBe(false);
        });
    });
    describe('validateWhatsAppJID', () => {
        it('should validate correct WhatsApp JID formats', () => {
            const validJIDs = [
                '5511999999999@s.whatsapp.net',
                '551199999999@s.whatsapp.net',
                '5511987654321@s.whatsapp.net',
                '5521987654321@s.whatsapp.net'
            ];
            validJIDs.forEach(jid => {
                expect(validateWhatsAppJID(jid)).toBe(true);
            });
        });
        it('should reject invalid WhatsApp JID formats', () => {
            const invalidJIDs = [
                'invalid-jid',
                '5511999999999',
                '@s.whatsapp.net',
                '5511999999999@whatsapp.net',
                '5511999999999@s.telegram.org',
                '55119999999999@s.whatsapp.net', // Too many digits
                '551199999@s.whatsapp.net' // Too few digits
            ];
            invalidJIDs.forEach(jid => {
                expect(validateWhatsAppJID(jid)).toBe(false);
            });
        });
        it('should handle edge cases', () => {
            expect(validateWhatsAppJID('')).toBe(false);
            expect(validateWhatsAppJID(null)).toBe(false);
            expect(validateWhatsAppJID(undefined)).toBe(false);
        });
    });
    describe('validateConversationAccess', () => {
        it('should validate conversation access for business owner', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'conv-123',
                                    business_id: 'business-456',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateConversationAccess('conv-123', 'business-456', mockSupabase);
            expect(isValid).toBe(true);
        });
        it('should reject conversation access for different business', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'conv-123',
                                    business_id: 'other-business',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateConversationAccess('conv-123', 'business-456', mockSupabase);
            expect(isValid).toBe(false);
        });
    });
    describe('validateAssistantAccess', () => {
        it('should validate assistant access for business owner', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'assistant-123',
                                    business_id: 'business-456',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateAssistantAccess('assistant-123', 'business-456', mockSupabase);
            expect(isValid).toBe(true);
        });
        it('should reject assistant access for different business', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'assistant-123',
                                    business_id: 'other-business',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const isValid = await validateAssistantAccess('assistant-123', 'business-456', mockSupabase);
            expect(isValid).toBe(false);
        });
    });
    describe('getSecurityHeaders', () => {
        it('should return appropriate security headers for development', () => {
            const headers = getSecurityHeaders('development');
            expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
            expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
            expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
            expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
        });
        it('should return stricter security headers for production', () => {
            const headers = getSecurityHeaders('production');
            expect(headers).toHaveProperty('Strict-Transport-Security');
            expect(headers).toHaveProperty('Content-Security-Policy');
            expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
        });
    });
    describe('logSecurityEvent', () => {
        it('should log security events with proper format', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logSecurityEvent('invalid_input', 'SQL injection attempt', 'business-123', {
                userAgent: 'test-agent',
                ip: '127.0.0.1'
            });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SECURITY_EVENT'), expect.objectContaining({
                event: 'invalid_input',
                message: 'SQL injection attempt',
                businessId: 'business-123'
            }));
            consoleSpy.mockRestore();
        });
        it('should handle missing optional parameters', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logSecurityEvent('test_event', 'Test message');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SECURITY_EVENT'), expect.objectContaining({
                event: 'test_event',
                message: 'Test message'
            }));
            consoleSpy.mockRestore();
        });
    });
    describe('checkRateLimit', () => {
        it('should allow requests within rate limits', async () => {
            const mockKV = {
                get: vi.fn().mockResolvedValue(null), // No existing rate limit data
                put: vi.fn().mockResolvedValue(undefined)
            };
            const isAllowed = await checkRateLimit('test-key', 100, // requests per minute
            mockKV);
            expect(isAllowed).toBe(true);
            expect(mockKV.put).toHaveBeenCalled();
        });
        it('should reject requests exceeding rate limits', async () => {
            const mockKV = {
                get: vi.fn().mockResolvedValue(JSON.stringify({
                    count: 100,
                    windowStart: Date.now() - 30000 // 30 seconds ago
                })),
                put: vi.fn().mockResolvedValue(undefined)
            };
            const isAllowed = await checkRateLimit('test-key', 100, // requests per minute
            mockKV);
            expect(isAllowed).toBe(false);
        });
        it('should reset rate limit window after expiry', async () => {
            const mockKV = {
                get: vi.fn().mockResolvedValue(JSON.stringify({
                    count: 100,
                    windowStart: Date.now() - 120000 // 2 minutes ago (expired)
                })),
                put: vi.fn().mockResolvedValue(undefined)
            };
            const isAllowed = await checkRateLimit('test-key', 100, // requests per minute
            mockKV);
            expect(isAllowed).toBe(true);
        });
    });
    describe('validateApiKey', () => {
        it('should validate correct API key format', () => {
            const validKeys = [
                'aida_live_1234567890abcdef',
                'aida_test_abcdef1234567890',
                'aida_dev_9876543210fedcba'
            ];
            validKeys.forEach(key => {
                expect(validateApiKey(key)).toBe(true);
            });
        });
        it('should reject invalid API key formats', () => {
            const invalidKeys = [
                'invalid-key',
                'aida_1234567890',
                'test_aida_1234567890abcdef',
                'aida_live_short',
                'aida_live_1234567890abcdef_extra',
                '',
                null,
                undefined
            ];
            invalidKeys.forEach(key => {
                expect(validateApiKey(key)).toBe(false);
            });
        });
    });
    describe('extractBusinessIdFromContext', () => {
        it('should extract business ID from authorization header', () => {
            const mockRequest = {
                headers: {
                    'authorization': 'Bearer aida_live_business123_token',
                    'x-business-id': 'header-business-456'
                }
            };
            const businessId = extractBusinessIdFromContext(mockRequest);
            expect(businessId).toBe('business123');
        });
        it('should extract business ID from X-Business-ID header', () => {
            const mockRequest = {
                headers: {
                    'x-business-id': 'header-business-456'
                }
            };
            const businessId = extractBusinessIdFromContext(mockRequest);
            expect(businessId).toBe('header-business-456');
        });
        it('should return null when no business ID found', () => {
            const mockRequest = {
                headers: {}
            };
            const businessId = extractBusinessIdFromContext(mockRequest);
            expect(businessId).toBe(null);
        });
        it('should handle malformed authorization headers', () => {
            const mockRequest = {
                headers: {
                    'authorization': 'Invalid header format'
                }
            };
            const businessId = extractBusinessIdFromContext(mockRequest);
            expect(businessId).toBe(null);
        });
    });
    describe('integration scenarios', () => {
        it('should handle complete security validation flow', async () => {
            const mockSupabase = {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'business-123',
                                    status: 'active'
                                },
                                error: null
                            })
                        })
                    })
                })
            };
            const mockKV = {
                get: vi.fn().mockResolvedValue(null),
                put: vi.fn().mockResolvedValue(undefined)
            };
            // Validate input
            const userInput = 'Hello, how can I help you?';
            expect(() => validateInput(userInput, 'message')).not.toThrow();
            // Check rate limit
            const rateLimitOk = await checkRateLimit('user-123', 100, mockKV);
            expect(rateLimitOk).toBe(true);
            // Validate business access
            const businessAccess = await validateBusinessAccess('business-123', 'user-123', mockSupabase);
            expect(businessAccess).toBe(true);
            // Validate WhatsApp JID
            const jidValid = validateWhatsAppJID('5511999999999@s.whatsapp.net');
            expect(jidValid).toBe(true);
        });
        it('should handle security violation scenarios', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            // SQL injection attempt
            expect(() => validateInput('\'; DROP TABLE users; --', 'test')).toThrow();
            // Invalid JID
            expect(validateWhatsAppJID('invalid-jid')).toBe(false);
            // Log security event
            logSecurityEvent('sql_injection', 'Attempted SQL injection', 'business-123');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
