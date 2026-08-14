import { getLeaderboardGrpc } from '@/lib/grpc';

export default async function LeaderboardGrpcTestPage({ searchParams }: { searchParams: { id?: string } }) {
  const tournamentId = searchParams.id || '296068e1-959c-493e-afcb-1d54f3b603d3'; // Fallback to a hardcoded ID for testing
  
  let result;
  let error;
  let timeMs = 0;

  try {
    const start = Date.now();
    result = await getLeaderboardGrpc(tournamentId);
    timeMs = Date.now() - start;
  } catch (err: any) {
    error = err.message || 'Unknown error occurred during gRPC call';
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">gRPC Proof of Concept: Leaderboard</h1>
      <p className="text-gray-600 mb-8">
        This page fetches data natively over HTTP/2 gRPC from Next.js Server Components directly to the NestJS microservice.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          <strong>Error fetching via gRPC:</strong> {error}
        </div>
      )}

      {result && (
        <>
          <div className="mb-6 flex gap-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200 flex-1">
              <strong>Status:</strong> Success
            </div>
            <div className="bg-blue-50 text-blue-700 p-4 rounded-md border border-blue-200 flex-1">
              <strong>Latency:</strong> {timeMs} ms
            </div>
          </div>

          <div className="bg-slate-900 rounded-md p-4 overflow-hidden">
            <h3 className="text-slate-300 font-semibold mb-2">Raw gRPC Protobuf Payload:</h3>
            <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
