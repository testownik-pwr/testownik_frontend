export enum Theme {
    DARK = 'dark',
    LIGHT = 'light'
}

export class AppTheme {
    private theme: Theme;

    constructor(theme: Theme = Theme.LIGHT) {
        this.theme = theme;
    }

    isDark(): boolean {
        return this.theme === Theme.DARK;
    }

    isLight(): boolean {
        return this.theme === Theme.LIGHT;
    }

    setTheme(theme: Theme): void {
        this.theme = theme;
        document.body.dataset.bsTheme = theme;
    }

    getTheme(): Theme {
        return this.theme;
    }

    getOppositeTheme(): Theme {
        return this.isDark() ? Theme.LIGHT : Theme.DARK;
    }
}