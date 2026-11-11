"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Something went wrong / Algo salió mal</h1>
        <p>Try again. / Intenta de nuevo.</p>
        <button onClick={reset} style={{ padding: "12px 20px", background: "#d92e2f", color: "#fff", border: 0, borderRadius: 10 }}>
          Try again / Reintentar
        </button>
      </body>
    </html>
  );
}
