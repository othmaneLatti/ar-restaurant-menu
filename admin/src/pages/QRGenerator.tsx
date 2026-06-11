import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, QrCode } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card, DataTable } from '../components/ui';

export default function QRGenerator() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState('');

  const { data: qrs, isLoading } = useQuery({
    queryKey: ['qrs', admin?.restaurant_id],
    queryFn: () => api.get(`/qr/${admin?.restaurant_id}`).then(res => res.data),
    enabled: !!admin?.restaurant_id,
  });

  const generateMutation = useMutation({
    mutationFn: (table: number) => api.post('/qr/generate', { table_number: table }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrs', admin?.restaurant_id] });
      setTableNumber('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to generate QR code.');
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tableNumber, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid table number.');
      return;
    }
    generateMutation.mutate(parsed);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-sora font-bold mb-2">QR Code Generator</h1>
        <p className="text-text-muted">Create AR Menu anchors for your tables.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 h-fit">
          <h2 className="text-xl font-sora font-bold mb-4 flex items-center gap-2">
            <QrCode size={20} className="text-primary" />
            Generate New
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <Input 
              label="Table Number" 
              type="number" 
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 12"
              required
            />
            {error && <div className="text-sm text-error">{error}</div>}
            <Button type="submit" disabled={generateMutation.isPending} className="w-full flex justify-center items-center gap-2">
              <Plus size={18} />
              {generateMutation.isPending ? 'Generating...' : 'Generate QR Code'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-sora font-bold mb-4">Existing Table QRs</h2>
            {isLoading ? (
              <div className="animate-pulse text-text-muted">Loading QR codes...</div>
            ) : qrs?.length === 0 ? (
              <div className="text-text-muted text-center py-8">No QR codes generated yet.</div>
            ) : (
              <DataTable headers={['Table', 'QR Preview', 'Generated', 'Action']}>
                {qrs.map((qr: any) => (
                  <tr key={qr.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-sora font-bold text-lg">Table {qr.table_number}</td>
                    <td className="px-6 py-4">
                      <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
                        <img src={qr.qr_image_url} alt={`QR Table ${qr.table_number}`} className="w-16 h-16 object-contain" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted text-sm">
                      {new Date(qr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDownload(qr.qr_image_url, `Table-${qr.table_number}-QR.png`)}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <Download size={16} />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
