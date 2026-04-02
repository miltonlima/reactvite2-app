function StoryPage() {
  return (
    <div style={{ height: '100vh', width: '100%', background: '#111' }}>
      <iframe
        title="Curso Storyline"
        src="/course/story.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allowFullScreen
      />
    </div>
  )
}

export default StoryPage
