// 10 comprehensive board templates across categories

export const templateSeeds = [
  // 1. Blank Canvas
  {
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty board',
    category: 'general',
    thumbnail: null,
    isSystem: true,
    templateData: {
      cards: [],
      connections: [],
      shapes: []
    }
  },

  // 2. Kanban Board
  {
    name: 'Kanban Board',
    description: '3-column task management board',
    category: 'planning',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'column', position: { x: 100, y: 100 }, size: { width: 250, height: 500 }, content: 'To Do', color: '#fef3c7', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 400, y: 100 }, size: { width: 250, height: 500 }, content: 'In Progress', color: '#dbeafe', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 700, y: 100 }, size: { width: 250, height: 500 }, content: 'Done', color: '#dcfce7', columnCards: [], zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 3. Storyboard
  {
    name: 'Storyboard',
    description: 'Visual storytelling with 6 frames',
    category: 'creative',
    thumbnail: null,
    templateData: {
      cards: [
        {
          type: 'storyboard',
          position: { x: 200, y: 200 },
          size: { width: 800, height: 500 },
          content: 'Storyboard',
          storyboardData: {
            title: 'New Story',
            frames: [
              { id: 'frame1', caption: 'Scene 1', notes: '' },
              { id: 'frame2', caption: 'Scene 2', notes: '' },
              { id: 'frame3', caption: 'Scene 3', notes: '' },
              { id: 'frame4', caption: 'Scene 4', notes: '' },
              { id: 'frame5', caption: 'Scene 5', notes: '' },
              { id: 'frame6', caption: 'Scene 6', notes: '' }
            ]
          },
          zIndex: 1
        }
      ],
      connections: [],
      shapes: []
    }
  },

  // 4. Mind Map
  {
    name: 'Mind Map',
    description: 'Central idea with branching concepts',
    category: 'planning',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'text', position: { x: 500, y: 300 }, size: { width: 200, height: 100 }, content: 'Central Idea', color: '#fef3c7', zIndex: 1 },
        { type: 'text', position: { x: 200, y: 200 }, size: { width: 150, height: 80 }, content: 'Branch 1', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 200, y: 400 }, size: { width: 150, height: 80 }, content: 'Branch 2', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 800, y: 200 }, size: { width: 150, height: 80 }, content: 'Branch 3', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 800, y: 400 }, size: { width: 150, height: 80 }, content: 'Branch 4', color: '#dbeafe', zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 5. Meeting Notes
  {
    name: 'Meeting Notes',
    description: 'Agenda, notes, and action items',
    category: 'business',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'richtext', position: { x: 100, y: 100 }, size: { width: 400, height: 200 }, htmlContent: '<h2>Agenda</h2><ul><li>Topic 1</li><li>Topic 2</li></ul>', zIndex: 1 },
        { type: 'richtext', position: { x: 550, y: 100 }, size: { width: 400, height: 200 }, htmlContent: '<h2>Notes</h2><p>Discussion points...</p>', zIndex: 1 },
        { type: 'todo', position: { x: 100, y: 350 }, size: { width: 400, height: 250 }, content: 'Action Items', todoData: { title: 'Action Items', items: [] }, zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 6. Sprint Planning
  {
    name: 'Sprint Planning',
    description: '5-column agile sprint board',
    category: 'planning',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'column', position: { x: 50, y: 100 }, size: { width: 200, height: 500 }, content: 'Backlog', color: '#f3f4f6', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 280, y: 100 }, size: { width: 200, height: 500 }, content: 'Sprint', color: '#fef3c7', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 510, y: 100 }, size: { width: 200, height: 500 }, content: 'In Progress', color: '#dbeafe', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 740, y: 100 }, size: { width: 200, height: 500 }, content: 'Review', color: '#fce7f3', columnCards: [], zIndex: 1 },
        { type: 'column', position: { x: 970, y: 100 }, size: { width: 200, height: 500 }, content: 'Done', color: '#dcfce7', columnCards: [], zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 7. Design Mood Board
  {
    name: 'Design Mood Board',
    description: 'Visual inspiration grid',
    category: 'creative',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'text', position: { x: 100, y: 50 }, size: { width: 800, height: 60 }, content: 'Project Name - Mood Board', color: '#ffffff', zIndex: 1 },
        { type: 'image', position: { x: 100, y: 150 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 },
        { type: 'image', position: { x: 380, y: 150 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 },
        { type: 'image', position: { x: 660, y: 150 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 },
        { type: 'image', position: { x: 100, y: 430 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 },
        { type: 'image', position: { x: 380, y: 430 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 },
        { type: 'image', position: { x: 660, y: 430 }, size: { width: 250, height: 250 }, imageUrl: '', color: '#f3f4f6', zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 8. Study Notes
  {
    name: 'Study Notes',
    description: 'Organized note-taking layout',
    category: 'education',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'text', position: { x: 100, y: 50 }, size: { width: 800, height: 60 }, content: 'Subject: ', color: '#fef3c7', zIndex: 1 },
        { type: 'markdown', position: { x: 100, y: 150 }, size: { width: 400, height: 400 }, markdown: '## Key Concepts\n\n- Concept 1\n- Concept 2', color: '#ffffff', zIndex: 1 },
        { type: 'markdown', position: { x: 550, y: 150 }, size: { width: 400, height: 400 }, markdown: '## Examples\n\nExample notes...', color: '#ffffff', zIndex: 1 },
        { type: 'richtext', position: { x: 100, y: 600 }, size: { width: 850, height: 200 }, htmlContent: '<h3>Summary</h3><p>Summary of learning...</p>', color: '#dcfce7', zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 9. SWOT Analysis
  {
    name: 'SWOT Analysis',
    description: '4-quadrant strategic analysis',
    category: 'business',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'richtext', position: { x: 100, y: 100 }, size: { width: 400, height: 300 }, htmlContent: '<h2>Strengths</h2><ul><li>Strength 1</li></ul>', color: '#dcfce7', zIndex: 1 },
        { type: 'richtext', position: { x: 550, y: 100 }, size: { width: 400, height: 300 }, htmlContent: '<h2>Weaknesses</h2><ul><li>Weakness 1</li></ul>', color: '#fee2e2', zIndex: 1 },
        { type: 'richtext', position: { x: 100, y: 450 }, size: { width: 400, height: 300 }, htmlContent: '<h2>Opportunities</h2><ul><li>Opportunity 1</li></ul>', color: '#dbeafe', zIndex: 1 },
        { type: 'richtext', position: { x: 550, y: 450 }, size: { width: 400, height: 300 }, htmlContent: '<h2>Threats</h2><ul><li>Threat 1</li></ul>', color: '#fef3c7', zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  },

  // 10. Roadmap
  {
    name: 'Roadmap',
    description: 'Timeline with milestones',
    category: 'planning',
    thumbnail: null,
    templateData: {
      cards: [
        { type: 'text', position: { x: 100, y: 50 }, size: { width: 1000, height: 60 }, content: 'Project Roadmap', color: '#ffffff', zIndex: 1 },
        { type: 'text', position: { x: 100, y: 200 }, size: { width: 200, height: 100 }, content: 'Q1 2026', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 350, y: 200 }, size: { width: 200, height: 100 }, content: 'Q2 2026', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 600, y: 200 }, size: { width: 200, height: 100 }, content: 'Q3 2026', color: '#dbeafe', zIndex: 1 },
        { type: 'text', position: { x: 850, y: 200 }, size: { width: 200, height: 100 }, content: 'Q4 2026', color: '#dbeafe', zIndex: 1 }
      ],
      connections: [],
      shapes: []
    }
  }
]
