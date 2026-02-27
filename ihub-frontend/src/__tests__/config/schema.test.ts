import { describe, it, expect } from 'vitest';
import { ConfigurationError } from '../../config/schema';

describe('ConfigurationError', () => {
    it('should create an error with message', () => {
        const error = new ConfigurationError('test error');
        expect(error.message).toBe('test error');
        expect(error.name).toBe('ConfigurationError');
    });

    it('should create an error with message and field', () => {
        const error = new ConfigurationError('test error', 'fieldName');
        expect(error.message).toBe('test error');
        expect(error.field).toBe('fieldName');
    });

    it('should be an instance of Error', () => {
        const error = new ConfigurationError('test');
        expect(error).toBeInstanceOf(Error);
    });
});
