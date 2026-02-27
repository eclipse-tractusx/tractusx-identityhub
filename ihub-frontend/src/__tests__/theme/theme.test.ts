import { describe, it, expect } from 'vitest';
import { theme } from '../../theme/theme';

describe('theme', () => {
    it('should have primary color', () => {
        expect(theme.palette.primary.main).toBe('rgb(1,32,96)');
    });

    it('should have custom breakpoints', () => {
        expect(theme.breakpoints.values.xs).toBe(0);
        expect(theme.breakpoints.values.sm).toBe(375);
        expect(theme.breakpoints.values.md).toBe(627);
        expect(theme.breakpoints.values.lg).toBe(1056);
        expect(theme.breakpoints.values.xl).toBe(1312);
    });

    it('should use Manrope font family', () => {
        expect(theme.typography.fontFamily).toContain('Manrope');
    });

    it('should have background colors', () => {
        expect(theme.palette.background.default).toBe('#000000');
        expect(theme.palette.background.paper).toBe('#000000');
    });

    it('should have error color', () => {
        expect(theme.palette.error.main).toBe('#D91E18');
    });

    it('should have success color', () => {
        expect(theme.palette.success.main).toBe('#00aa55');
    });

    it('should have border radius', () => {
        expect(theme.shape.borderRadius).toBe(4);
    });
});
