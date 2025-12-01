import Link from 'next/link';

export default function Cancel() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>❌ Payment Cancelled</h1>
        <p style={styles.description}>Your payment was cancelled.</p>
        <Link href="/" style={styles.link}>
          Try Again
        </Link>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f5f5f5',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 10px',
    fontSize: '24px',
    color: '#ef4444',
  },
  description: {
    color: '#666',
    marginBottom: '20px',
  },
  link: {
    color: '#635bff',
    textDecoration: 'none',
  },
};
