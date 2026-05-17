/**
 * Script de Seed - AirBEMI
 * Insère 12 logements réalistes au Maroc dans MongoDB.
 * Usage: node seed.js
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/airbemi_db';

const propertySchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  pricePerNight: Number,
  maxGuests: Number,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  address: { city: String, country: String },
  amenities: [String],
  imageUrl: String,
  rating: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

propertySchema.index({ location: '2dsphere' });

const Property = mongoose.model('Property', propertySchema, 'properties');

const PROPERTIES = [
  {
    title: 'Riad Dar Salam — Médina de Marrakech',
    description: 'Magnifique riad traditionnel au cœur de la médina de Marrakech. Patio intérieur avec fontaine, décoration artisanale, toit-terrasse avec vue panoramique sur les toits de la ville rouge.',
    pricePerNight: 1800,
    maxGuests: 6,
    location: { type: 'Point', coordinates: [-7.9874, 31.6295] },
    address: { city: 'Marrakech', country: 'Maroc' },
    amenities: ['Wi-Fi', 'Piscine', 'Petit-déjeuner inclus', 'Climatisation', 'Service de ménage'],
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    rating: 4.97,
  },
  {
    title: 'Villa Azzurra — Front de Mer Agadir',
    description: 'Splendide villa contemporaine avec piscine à débordement donnant directement sur l\'Atlantique. Architecture blanche et bleue, intérieur design, à 2 minutes de la plage d\'Agadir.',
    pricePerNight: 3200,
    maxGuests: 8,
    location: { type: 'Point', coordinates: [-9.5981, 30.4202] },
    address: { city: 'Agadir', country: 'Maroc' },
    amenities: ['Piscine', 'Vue sur mer', 'Parking', 'Barbecue', 'Wi-Fi', 'Climatisation'],
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    rating: 4.95,
  },
  {
    title: 'Appartement Vue Mer — Marina Casablanca',
    description: 'Appartement haut de gamme au 15ème étage avec vue à 180° sur l\'Atlantique et la Marina de Casablanca. Décoration moderne et épurée, idéal pour séjour d\'affaires ou city break.',
    pricePerNight: 1200,
    maxGuests: 4,
    location: { type: 'Point', coordinates: [-7.6343, 33.6064] },
    address: { city: 'Casablanca', country: 'Maroc' },
    amenities: ['Wi-Fi', 'Parking', 'Concierge', 'Salle de sport', 'Climatisation'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    rating: 4.88,
  },
  {
    title: 'Maison Bleue — Chefchaouen',
    description: 'Authentique maison berbère dans la perle bleue du Rif. Terrasse avec vue sur les montagnes, décoration traditionnelle, ambiance unique. Le meilleur point de départ pour explorer les ruelles bleues.',
    pricePerNight: 650,
    maxGuests: 4,
    location: { type: 'Point', coordinates: [-5.2636, 35.1688] },
    address: { city: 'Chefchaouen', country: 'Maroc' },
    amenities: ['Wi-Fi', 'Terrasse', 'Vue montagne', 'Petit-déjeuner marocain'],
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80',
    rating: 4.92,
  },
  {
    title: 'Suite Royale — Palais Fès el-Bali',
    description: 'Ancienne demeure de pacha transformée en palace de charme au cœur de la médina de Fès. Salons marocains authentiques, zellige artisanal, hammam privatif et jardin andalou secret.',
    pricePerNight: 2500,
    maxGuests: 5,
    location: { type: 'Point', coordinates: [-4.9781, 34.0655] },
    address: { city: 'Fès', country: 'Maroc' },
    amenities: ['Hammam privatif', 'Jardin', 'Wi-Fi', 'Petit-déjeuner inclus', 'Service de conciergerie'],
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    rating: 4.99,
  },
  {
    title: 'Cabane Éco-Lodge — Vallée de l\'Ourika',
    description: 'Retraite écologique au pied du Haut Atlas. Cabanes en bois, vue sur cascade, rivière traversant la propriété. Cuisine traditionnelle berbère, randonnées guidées disponibles. Le dépaysement total.',
    pricePerNight: 890,
    maxGuests: 2,
    location: { type: 'Point', coordinates: [-7.7100, 31.3770] },
    address: { city: 'Vallée de l\'Ourika', country: 'Maroc' },
    amenities: ['Nature', 'Randonnée', 'Repas inclus', 'Aucune connexion — déconnexion totale'],
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    rating: 4.94,
  },
  {
    title: 'Penthouse Design — Rabat Hassan',
    description: 'Penthouse contemporain de 180m² avec terrasse privative de 60m² dominant la Tour Hassan et la Kasbah des Oudayas. Cuisine équipée, espace de travail professionnel, décoration design.',
    pricePerNight: 1600,
    maxGuests: 6,
    location: { type: 'Point', coordinates: [-6.8498, 33.9716] },
    address: { city: 'Rabat', country: 'Maroc' },
    amenities: ['Terrasse 60m²', 'Wi-Fi Fibre', 'Parking', 'Espace de travail', 'Climatisation'],
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    rating: 4.91,
  },
  {
    title: 'Bungalow Tropical — Palmeraie de Marrakech',
    description: 'Bungalow de luxe niché dans 5 hectares de palmeraie aux portes de Marrakech. Piscine privée entourée de palmiers, jacuzzi extérieur, quads et chevaux disponibles sur place. Pure magie.',
    pricePerNight: 2800,
    maxGuests: 4,
    location: { type: 'Point', coordinates: [-8.0305, 31.6860] },
    address: { city: 'Palmeraie, Marrakech', country: 'Maroc' },
    amenities: ['Piscine privée', 'Jacuzzi', 'Activités équestres', 'Climatisation', 'Wi-Fi', 'Navette Marrakech'],
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    rating: 4.96,
  },
  {
    title: 'Studio Moderne — Gueliz Marrakech',
    description: 'Studio parfaitement aménagé dans le quartier moderne de Gueliz. Idéal pour solo ou couple, proche des meilleurs restaurants, galeries et boutiques. Design minimaliste et fonctionnel.',
    pricePerNight: 480,
    maxGuests: 2,
    location: { type: 'Point', coordinates: [-8.0051, 31.6318] },
    address: { city: 'Marrakech', country: 'Maroc' },
    amenities: ['Wi-Fi', 'Climatisation', 'Cuisine équipée', 'Netflix'],
    imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
    rating: 4.82,
  },
  {
    title: 'Villa Atlas — Ouarzazate',
    description: 'Majestueuse villa aux portes du Sahara, face aux sommets enneigés du Haut Atlas. Architecture kasba, piscine chauffée, hammam, étoiles filantes garanties depuis la terrasse. L\'adresse des voyageurs d\'exception.',
    pricePerNight: 2200,
    maxGuests: 8,
    location: { type: 'Point', coordinates: [-6.8934, 30.9335] },
    address: { city: 'Ouarzazate', country: 'Maroc' },
    amenities: ['Piscine chauffée', 'Hammam', 'Vue Atlas', 'Excursion désert', 'Wi-Fi', 'Chef privé'],
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    rating: 4.98,
  },
  {
    title: 'Dar Nour — Essaouira Bord de Mer',
    description: 'Maison d\'hôtes de charme dans la cité des Alizés, à 50m de l\'Atlantique. Style colonial-marocain, terrasse sur les remparts, vent frais en permanence. Paradis des surfeurs et des artistes.',
    pricePerNight: 950,
    maxGuests: 6,
    location: { type: 'Point', coordinates: [-9.7703, 31.5085] },
    address: { city: 'Essaouira', country: 'Maroc' },
    amenities: ['Vue mer', 'Wi-Fi', 'Surf à proximité', 'Terrasse remparts', 'Petit-déjeuner inclus'],
    imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    rating: 4.93,
  },
  {
    title: 'Loft Artistique — Tanger Médina',
    description: 'Ancien atelier d\'artiste transformé en loft design dans la médina de Tanger. Haute verrière, mezzanine, oeuvres originales, vue sur le Détroit de Gibraltar. L\'adresse bohème par excellence.',
    pricePerNight: 1100,
    maxGuests: 3,
    location: { type: 'Point', coordinates: [-5.8044, 35.7721] },
    address: { city: 'Tanger', country: 'Maroc' },
    amenities: ['Wi-Fi', 'Vue Détroit', 'Climatisation', 'Rooftop partagé', 'Vélos disponibles'],
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    rating: 4.87,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB');

  const count = await Property.countDocuments();
  if (count > 0) {
    console.log(`ℹ️  ${count} logements déjà présents. Suppression pour re-seeder...`);
    await Property.deleteMany({});
  }

  // On crée un faux hostId (ObjectId valide)
  const fakeHostId = new mongoose.Types.ObjectId();

  const docs = PROPERTIES.map(p => ({ ...p, hostId: fakeHostId }));
  await Property.insertMany(docs);

  console.log(`✅ ${docs.length} logements insérés avec succès dans MongoDB !`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Erreur lors du seed:', err);
  process.exit(1);
});
