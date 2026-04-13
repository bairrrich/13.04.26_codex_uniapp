export default function NotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>404</h1>
      <p style={{ color: '#888' }}>Страница не найдена</p>
      <a
        href="/"
        style={{ color: '#5B6CFF', textDecoration: 'none' }}
      >
        Вернуться на главную
      </a>
    </div>
  );
}
