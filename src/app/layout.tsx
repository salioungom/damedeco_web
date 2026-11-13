import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '@/theme';
import { Providers } from '@/components/Providers';
import { AuthProvider } from '@/contexts/AuthContext';
import { Footer } from '@/components/Footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://damedeco.shop';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: 'DameDéco - Import & Commerce',
    description: 'Importation de produits de qualité depuis la Chine',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body>
                <AuthProvider>
                    <AppRouterCacheProvider>
                        <ThemeProvider theme={theme}>
                            <CssBaseline />
                            <Providers>{children}</Providers>
                            <Footer />
                        </ThemeProvider>
                    </AppRouterCacheProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
