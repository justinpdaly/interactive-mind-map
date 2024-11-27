// Define icons using Font Awesome
const Icons = {
  Plus: () => <i className="fas fa-plus"></i>,
  ArrowUpCircle: () => <i className="fas fa-arrow-circle-up"></i>,
  ZoomIn: () => <i className="fas fa-search-plus"></i>,
  ZoomOut: () => <i className="fas fa-search-minus"></i>,
  Download: () => <i className="fas fa-download"></i>,
  Sun: () => <i className="fas fa-sun"></i>,
  Moon: () => <i className="fas fa-moon"></i>,
  Edit2: () => <i className="fas fa-edit"></i>,
  Trash2: () => <i className="fas fa-trash"></i>,
  Check: () => <i className="fas fa-check"></i>
};

// Create the main component
const MindMapCreator = () => {
  const [nodes, setNodes] = React.useState([
    { id: 1, text: 'Central Idea', x: 400, y: 300, isRoot: true }
  ]);
  const [connections, setConnections] = React.useState([]);
  const [newNodeText, setNewNodeText] = React.useState('');
  const [editingNode, setEditingNode] = React.useState(null);
  const [editText, setEditText] = React.useState('');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [selectedParentId, setSelectedParentId] = React.useState(1);
  const svgRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const calculateNewPosition = (parentNode) => {
    const childConnections = connections.filter(conn => conn.from === parentNode.id);
    const angle = ((childConnections.length + 1) * (2 * Math.PI)) / 8;
    const radius = 150;
    
    return {
      x: parentNode.x + radius * Math.cos(angle),
      y: parentNode.y + radius * Math.sin(angle)
    };
  };

  const startDragging = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    setOffset(newOffset);
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  const addNode = () => {
    if (!newNodeText.trim()) return;
    
    const parentNode = nodes.find(n => n.id === selectedParentId);
    const position = calculateNewPosition(parentNode);
    const newNode = {
      id: nodes.length + 1,
      text: newNodeText,
      x: position.x,
      y: position.y,
      isRoot: false
    };

    setNodes([...nodes, newNode]);
    setConnections([...connections, {
      id: connections.length + 1,
      from: selectedParentId,
      to: newNode.id
    }]);
    setNewNodeText('');
  };

  const selectNodeAsParent = (nodeId, e) => {
    e.stopPropagation();
    setSelectedParentId(nodeId);
  };

  const startEditing = (node, e) => {
    e.stopPropagation();
    setEditingNode(node.id);
    setEditText(node.text);
  };

  const saveEdit = (e) => {
    e.stopPropagation();
    if (!editText.trim()) return;
    setNodes(nodes.map(node => 
      node.id === editingNode ? { ...node, text: editText } : node
    ));
    setEditingNode(null);
    setEditText('');
  };

  const deleteNode = (nodeId, e) => {
    e.stopPropagation();
    if (nodes.find(n => n.id === nodeId).isRoot) return;
    
    if (nodeId === selectedParentId) {
      setSelectedParentId(1);
    }
    
    setNodes(nodes.filter(node => node.id !== nodeId));
    setConnections(connections.filter(conn => 
      conn.from !== nodeId && conn.to !== nodeId
    ));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.2, 0.5);
      if (newZoom <= 1) {
        setOffset({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const exportToSVG = () => {
    if (!svgRef.current) return;
    
    const svgCopy = svgRef.current.cloneNode(true);
    const editControls = svgCopy.querySelectorAll('.edit-controls');
    editControls.forEach(control => control.remove());
    
    const svgString = new XMLSerializer().serializeToString(svgCopy);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mindmap.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const returnToRoot = () => {
    setSelectedParentId(1);
  };

  return (
    <div className={`max-w-4xl mx-auto p-4 ${isDarkMode ? 'dark bg-slate-800' : 'bg-white'} rounded-lg shadow-lg`}>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newNodeText}
          onChange={(e) => setNewNodeText(e.target.value)}
          placeholder={`Add branch to "${nodes.find(n => n.id === selectedParentId)?.text}"`}
          className={`flex-grow p-2 rounded border ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'border-slate-300'}`}
        />
        <button 
          onClick={addNode} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Icons.Plus className="w-4 h-4" /> Add
        </button>
        {selectedParentId !== 1 && (
          <button 
            onClick={returnToRoot} 
            className={`flex items-center gap-2 px-4 py-2 rounded border ${
              isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'
            }`}
          >
            <Icons.ArrowUpCircle className="w-4 h-4" /> Return to Root
          </button>
        )}
        <button onClick={handleZoomIn} className={`p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}>
          <Icons.ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className={`p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}>
          <Icons.ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={exportToSVG} className={`p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}>
          <Icons.Download className="w-4 h-4" />
        </button>
        <button 
          onClick={toggleDarkMode} 
          className={`p-2 rounded border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}
        >
          {isDarkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`relative w-full h-96 border rounded-lg overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'
        } ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={startDragging}
        onMouseMove={handleDrag}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox="0 0 800 600"
          style={{
            transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            return (
              <line
                key={conn.id}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isDarkMode ? '#475569' : '#94a3b8'}
                strokeWidth="2"
              />
            );
          })}
          
          {nodes.map(node => (
            <g 
              key={node.id}
              onClick={(e) => selectNodeAsParent(node.id, e)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.isRoot ? 60 : 40}
                fill={node.id === selectedParentId ? 
                  (isDarkMode ? '#6366f1' : '#818cf8') :
                  (isDarkMode ? 
                    (node.isRoot ? '#475569' : '#334155') : 
                    (node.isRoot ? '#e2e8f0' : '#f1f5f9')
                  )
                }
                stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                strokeWidth={node.id === selectedParentId ? 3 : 2}
              />
              
              {editingNode === node.id ? (
                <foreignObject
                  x={node.x - 50}
                  y={node.y - 15}
                  width="100"
                  height="30"
                >
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={`h-6 px-1 py-0 text-xs rounded ${isDarkMode ? 'bg-slate-700 text-white' : ''}`}
                      autoFocus
                    />
                    <button
                      className="h-6 w-6 flex items-center justify-center bg-green-500 text-white rounded"
                      onClick={(e) => saveEdit(e)}
                    >
                      <Icons.Check className="w-3 h-3" />
                    </button>
                  </div>
                </foreignObject>
              ) : (
                <>
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-sm font-medium ${isDarkMode ? 'fill-slate-200' : 'fill-slate-700'}`}
                  >
                    {node.text}
                  </text>
                  
                  {!node.isRoot && (
                    <g className="edit-controls">
                      <g transform={`translate(${node.x + 45}, ${node.y - 25})`}>
                        <circle
                          r="12"
                          fill={isDarkMode ? '#475569' : '#e2e8f0'}
                          className="cursor-pointer"
                          onClick={(e) => startEditing(node, e)}
                        />
                        <g transform="translate(-6, -6)">
                          <Icons.Edit2 className="w-3 h-3" />
                        </g>
                      </g>

                      <g transform={`translate(${node.x + 45}, ${node.y + 25})`}>
                        <circle
                          r="12"
                          fill={isDarkMode ? '#475569' : '#e2e8f0'}
                          className="cursor-pointer"
                          onClick={(e) => deleteNode(node.id, e)}
                        />
                        <g transform="translate(-6, -6)">
                          <Icons.Trash2 className="w-3 h-3" />
                        </g>
                      </g>
                    </g>
                  )}
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

// Wait for DOM to load before rendering
window.addEventListener('DOMContentLoaded', () => {
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<MindMapCreator />);
    // Initialize icons after render
    window.lucide.createIcons();
  } catch (error) {
    console.error('Error rendering app:', error);
    document.getElementById('root').innerHTML = `
      <div class="p-4 text-red-500">
        Error loading Mind Map Creator: ${error.message}
      </div>
    `;
  }
});
