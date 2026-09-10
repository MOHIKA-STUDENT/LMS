'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CourseMaterial } from '@/types/database';
import { BookOpen, Download, FileText, File } from 'lucide-react';

export default function StudentNotesPage() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('batch_id')
          .eq('id', user.id)
          .single();

        if (profile?.batch_id) {
          const { data: mData } = await supabase
            .from('course_materials')
            .select('*')
            .eq('batch_id', profile.batch_id)
            .order('created_at', { ascending: false });

          if (mData) setMaterials(mData);
        }
      }
      setLoading(false);
    };

    fetchNotes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-indigo-400" />
          <span>Notes Vault & Study Guides</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Access and download lesson presentations, PDFs, and study guides for your batch</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading study notes...</div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <File className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Course Materials Found</h3>
          <p className="text-sm text-slate-500 mt-1">Your teacher has not uploaded any study guides for your batch yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 border border-slate-700 rounded text-xs font-mono font-bold">
                      {m.file_type.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-white text-base mt-1">{m.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{m.description || 'No additional details.'}</p>
                <div className="text-xs text-slate-500">Size: {(m.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</div>
              </div>

              <a
                href={m.file_url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Study Material</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
