
import { useState } from 'react';
import { Button } from '@/components/button';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useToastStore } from '@/store/useToastStore';
import * as XLSX from 'xlsx';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportProductsModal({ isOpen, onClose, onSuccess }: ImportProductsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { addToast } = useToastStore();

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      'Title', 'Description', 'BasePrice', 'CategorySlug', 'MOQ', 'SKUCode', 'Color', 'Size'
    ];
    const sampleData = [
      {
        Title: 'Sample Sneaker',
        Description: 'High quality running shoe',
        BasePrice: 50,
        CategorySlug: 'men-shoes',
        MOQ: 10,
        SKUCode: 'SNK-001-RED-42',
        Color: 'Red',
        Size: '42'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "product_import_template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.success > 0) {
        addToast(`Successfully imported ${res.data.success} products`, 'success');
        onSuccess();
      }
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Import failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
            Import Products
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Template Format
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Please use the standard template. The Excel file must contain the following columns:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-400">
                <thead className="text-xs text-zinc-700 uppercase bg-blue-100 dark:bg-blue-800 dark:text-zinc-300">
                  <tr>
                    <th className="px-2 py-1">Title</th>
                    <th className="px-2 py-1">BasePrice</th>
                    <th className="px-2 py-1">CategorySlug</th>
                    <th className="px-2 py-1">SKUCode</th>
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Size</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-zinc-900 border-b dark:border-zinc-800">
                    <td className="px-2 py-1">Sample Shoe</td>
                    <td className="px-2 py-1">50.00</td>
                    <td className="px-2 py-1">men-shoes</td>
                    <td className="px-2 py-1">ABC-001</td>
                    <td className="px-2 py-1">Red</td>
                    <td className="px-2 py-1">42</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {file ? file.name : "Click to select Excel file"}
                </span>
              </label>
            </div>

            {file && (
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Result Section */}
          {result && (
            <div className={`p-4 rounded-lg border ${result.failed > 0 ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
              <div className="flex items-center gap-2 font-semibold mb-2">
                {result.failed > 0 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                Import Result
              </div>
              <div className="text-sm space-y-1">
                <p>Success: {result.success}</p>
                <p>Failed: {result.failed}</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-white dark:bg-zinc-950 rounded border border-orange-200 dark:border-orange-800 max-h-32 overflow-y-auto">
                    <p className="font-medium text-xs text-zinc-500 mb-1">Errors:</p>
                    {result.errors.map((err: string, i: number) => (
                      <p key={i} className="text-red-500 text-xs">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
