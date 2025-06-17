import 'dotenv/config';

export default {
  expo: {
    name: 'stations-app',
    slug: 'stations-app',
    version: '1.0.0',
    sdkVersion: '53.0.0',
    extra: {
      pokemonApiUrl: process.env.POKEMON_API_URL,
    },
  },
};