import { describe, it, expect } from 'vitest';
import { getStateName, CREDENTIAL_STATES } from '../../../features/credentials/types';

describe('credentials types', () => {
    describe('getStateName', () => {
        it('should return INITIAL for state 100', () => {
            expect(getStateName(100)).toBe('INITIAL');
        });

        it('should return REQUESTED for state 200', () => {
            expect(getStateName(200)).toBe('REQUESTED');
        });

        it('should return ISSUING for state 300', () => {
            expect(getStateName(300)).toBe('ISSUING');
        });

        it('should return ISSUED for state 400', () => {
            expect(getStateName(400)).toBe('ISSUED');
        });

        it('should return STORED for state 500', () => {
            expect(getStateName(500)).toBe('STORED');
        });

        it('should return REVOKED for state 600', () => {
            expect(getStateName(600)).toBe('REVOKED');
        });

        it('should return SUSPENDED for state 700', () => {
            expect(getStateName(700)).toBe('SUSPENDED');
        });

        it('should return Unknown for undefined state', () => {
            expect(getStateName(undefined)).toBe('Unknown');
        });

        it('should return "State X" for unknown state number', () => {
            expect(getStateName(999)).toBe('State 999');
        });
    });

    describe('CREDENTIAL_STATES', () => {
        it('should have 7 states', () => {
            expect(Object.keys(CREDENTIAL_STATES)).toHaveLength(7);
        });
    });

});
