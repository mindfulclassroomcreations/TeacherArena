'use client';

import { useState, useEffect } from 'react';

interface ProductIdea {
  id: string;
  product_title: string;
  grade_level: string;
  standards: string;
  notes: string;
  category: string;
  created_at: string;
}

export default function Home() {
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [topic, setTopic] = useState('');
  const [gradeRange, setGradeRange] = useState('6-12');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ideas');
      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      setMessage('Failed to fetch ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!topic.trim()) {
      setMessage('Please enter a topic to research');
      return;
    }

    setResearching(true);
    setMessage('');

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, gradeRange }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully generated ${data.count} product ideas!`);
        setTopic('');
        await fetchIdeas();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error researching:', error);
      setMessage('Failed to generate ideas. Check your API configuration.');
    } finally {
      setResearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;

    try {
      const response = await fetch(`/api/ideas?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Idea deleted successfully');
        await fetchIdeas();
      } else {
        setMessage('Failed to delete idea');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      setMessage('Failed to delete idea');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">
            TPT Product Idea Automation
          </h1>
          <p className="text-gray-700">
            Generate and organize digital product ideas for Teachers Pay Teachers
          </p>
        </header>

        {/* Research Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Generate New Product Ideas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic or Subject Area
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Math fractions, Reading comprehension, Science labs"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={researching}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Range
              </label>
              <select
                value={gradeRange}
                onChange={(e) => setGradeRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={researching}
              >
                <option value="6-8">Grades 6-8</option>
                <option value="9-12">Grades 9-12</option>
                <option value="6-12">Grades 6-12</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleResearch}
            disabled={researching}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {researching ? 'Generating Ideas...' : 'Generate Product Ideas'}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.includes('Error') || message.includes('Failed')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Ideas List Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Product Ideas Library ({ideas.length})
            </h2>
            <button
              onClick={fetchIdeas}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading && ideas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading ideas...</div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No ideas yet. Generate some using the form above!
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-indigo-900">
                      {idea.product_title}
                    </h3>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Grade Level:</span>
                      <p className="text-gray-800">{idea.grade_level}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <p className="text-gray-800">{idea.category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <p className="text-gray-800">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-600">Standards:</span>
                    <p className="text-gray-800">{idea.standards}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-600">Notes:</span>
                    <p className="text-gray-700 mt-1">{idea.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
