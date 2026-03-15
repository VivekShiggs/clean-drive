import { useState, useRef } from 'react';
import { Upload, CheckCircle2, XCircle, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import api from '../../lib/api';

interface UploadResult {
  message: string;
  drivers: number;
  vehicles: number;
  errors: string[];
}

export default function FleetUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/fleet/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Sheet: Drivers',
      'fullName,email,password,phone,licenceNumber',
      'John Smith,john@example.com,Pass123!,0821234567,DL123456',
      '',
      'Sheet: Vehicles',
      'plateNumber,make,model,year,colour',
      'CA 123-456,Toyota,Corolla,2022,White',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clean-drive-template-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Bulk Upload</h1>
        <p className="text-gray-400 text-sm mt-1">Add multiple drivers and vehicles at once via Excel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload card */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-green-400" />
            <h2 className="font-semibold text-white">Upload .xlsx file</h2>
          </div>

          {/* Drop zone */}
          <label
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              file ? 'border-green-500 bg-green-500/5' : 'border-gray-700 hover:border-gray-500 bg-gray-800/40'
            }`}
          >
            <Upload size={28} className={file ? 'text-green-400' : 'text-gray-500'} />
            <p className="mt-2 text-sm font-medium text-gray-300">
              {file ? file.name : 'Click or drag .xlsx file here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .xlsx only'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={e => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                setError('');
              }}
            />
          </label>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
              <XCircle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary w-full py-3"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Instructions card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Excel format guide</h2>
            <button onClick={downloadTemplate} className="btn-secondary text-xs py-1.5 px-3">
              <Download size={13} /> Download guide
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-green-400 font-medium mb-2">Sheet 1 — named "Drivers"</p>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700">
                      {['fullName', 'email', 'password', 'phone', 'licenceNumber'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-300 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 text-gray-400">John Smith</td>
                      <td className="px-3 py-2 text-gray-400">john@...</td>
                      <td className="px-3 py-2 text-gray-400">Pass123!</td>
                      <td className="px-3 py-2 text-gray-400">082...</td>
                      <td className="px-3 py-2 text-gray-400">DL123</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-green-400 font-medium mb-2">Sheet 2 — named "Vehicles"</p>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700">
                      {['plateNumber', 'make', 'model', 'year', 'colour'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-300 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 text-gray-400">CA 123-456</td>
                      <td className="px-3 py-2 text-gray-400">Toyota</td>
                      <td className="px-3 py-2 text-gray-400">Corolla</td>
                      <td className="px-3 py-2 text-gray-400">2022</td>
                      <td className="px-3 py-2 text-gray-400">White</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-gray-500 text-xs">Both sheets must exist in the same .xlsx file. Column headers must match exactly.</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 card border-green-800 bg-green-950/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-green-400" />
            <h3 className="font-semibold text-green-300">Upload complete</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-900/30 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{result.drivers}</p>
              <p className="text-xs text-gray-400 mt-0.5">Drivers added</p>
            </div>
            <div className="bg-green-900/30 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-white">{result.vehicles}</p>
              <p className="text-xs text-gray-400 mt-0.5">Vehicles added</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-400">Skipped rows:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-gray-400 bg-gray-800 rounded px-3 py-1.5">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
