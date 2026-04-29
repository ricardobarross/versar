/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantendo as suas configurações de ignorar erros para facilitar o deploy
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ADICIONE ESTA PARTE ABAIXO:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Permite todas as imagens do seu banco de dados Supabase
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Útil para testes
      },
    ],
  },
};

export default nextConfig;