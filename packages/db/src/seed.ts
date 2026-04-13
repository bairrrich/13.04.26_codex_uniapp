/**
 * Seed script to populate database with initial data.
 * Run with: npx tsx packages/db/src/seed.ts
 */

import { db } from './index';
import * as schema from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Exercise definitions
  const exercises = [
    { name: 'Отжимания', muscle_group: 'Грудь/Трицепс' },
    { name: 'Подтягивания', muscle_group: 'Спина/Бицепс' },
    { name: 'Приседания', muscle_group: 'Ноги' },
    { name: 'Жим лёжа', muscle_group: 'Грудь' },
    { name: 'Становая тяга', muscle_group: 'Спина/Ноги' },
    { name: 'Жим стоя', muscle_group: 'Плечи' },
    { name: 'Планка', muscle_group: 'Кор' },
    { name: 'Выпады', muscle_group: 'Ноги' },
    { name: 'Тяга в наклоне', muscle_group: 'Спина' },
    { name: 'Бицепс с гантелями', muscle_group: 'Бицепс' },
  ];

  console.log('📋 Inserting exercises...');
  for (const ex of exercises) {
    await db.insert(schema.exerciseDefinitions).values(ex);
  }

  // Food items
  const foods = [
    { source: 'user', name: 'Куриная грудка', kcal: '165', protein_g: '31', fat_g: '3.6', carbs_g: '0' },
    { source: 'user', name: 'Рис', kcal: '130', protein_g: '2.7', fat_g: '0.3', carbs_g: '28' },
    { source: 'user', name: 'Овсянка', kcal: '150', protein_g: '5', fat_g: '3', carbs_g: '27' },
    { source: 'user', name: 'Яйцо', kcal: '155', protein_g: '13', fat_g: '11', carbs_g: '1.1' },
    { source: 'user', name: 'Банан', kcal: '89', protein_g: '1.1', fat_g: '0.3', carbs_g: '23' },
    { source: 'user', name: 'Творог 5%', kcal: '120', protein_g: '17', fat_g: '5', carbs_g: '3' },
    { source: 'user', name: 'Гречка', kcal: '132', protein_g: '4.5', fat_g: '2.3', carbs_g: '24' },
    { source: 'user', name: 'Лосось', kcal: '208', protein_g: '20', fat_g: '13', carbs_g: '0' },
  ];

  console.log('🍽️ Inserting food items...');
  for (const food of foods) {
    await db.insert(schema.foodItems).values(food);
  }

  console.log('✅ Seed completed!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
