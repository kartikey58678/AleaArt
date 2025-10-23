import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">
            🎨 AleaArt
          </h1>
          <p className="text-2xl mb-8 text-blue-100">
            Generate Unique Art Parameters with Blockchain Randomness
          </p>
          <p className="text-lg mb-12 text-blue-200 max-w-3xl mx-auto">
            Create deterministic art parameters using Pyth Entropy V2 on Arbitrum Sepolia. 
            Each generation produces unique visual parameters that can be used for AI art creation.
          </p>
          
          <div className="flex justify-center gap-6 mb-16">
            <Link 
              href="/signup"
              className="bg-white text-purple-600 px-8 py-4 rounded-full text-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-semibold mb-2">True Randomness</h3>
              <p className="text-blue-100">
                Powered by Pyth Entropy V2 for verifiable on-chain randomness
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Art Parameters</h3>
              <p className="text-blue-100">
                Generate prompt, style, sampler, and visual parameters for AI art
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl mb-4">💾</div>
              <h3 className="text-xl font-semibold mb-2">Save & Track</h3>
              <p className="text-blue-100">
                Store your generated art parameters in your personal profile
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}