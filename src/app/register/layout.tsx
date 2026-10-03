import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Inscription - DameDéco',
    description: 'Créez votre compte DameDéco',
};

export default function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
        </div>
    );
}
