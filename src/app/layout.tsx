import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Automatalib Simulator',
    description: 'A pure Finite State Automata Graph Visualizer',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 overflow-hidden m-0 p-0`}>
                {children}
            </body>
        </html>
    )
}
