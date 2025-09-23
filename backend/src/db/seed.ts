import { db, sql } from './config';
import { sourceWebsites, componentTypes } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed source websites
    const sources = await db.insert(sourceWebsites).values([
      {
        name: 'shadcn/ui',
        slug: 'shadcn-ui',
        url: 'https://ui.shadcn.com',
        description: 'Official shadcn/ui components library',
        licenseType: 'MIT',
        isActive: true,
      },
      {
        name: 'Shadcnblocks',
        slug: 'shadcnblocks',
        url: 'https://www.shadcnblocks.com',
        description: 'Free blocks and components for shadcn/ui',
        licenseType: 'MIT',
        isActive: true,
      },
      {
        name: 'Magic UI',
        slug: 'magic-ui',
        url: 'https://magicui.design',
        description: 'Beautiful UI components built with shadcn/ui',
        licenseType: 'Mixed',
        isActive: true,
      },
      {
        name: 'Aceternity UI',
        slug: 'aceternity-ui',
        url: 'https://ui.aceternity.com',
        description: 'Modern UI components and templates',
        licenseType: 'Mixed',
        isActive: true,
      },
      {
        name: 'Origin UI',
        slug: 'origin-ui',
        url: 'https://originui.com',
        description: 'Premium shadcn/ui components',
        licenseType: 'MIT',
        isActive: true,
      },
      {
        name: 'Cult UI',
        slug: 'cult-ui',
        url: 'https://www.cult-ui.com',
        description: 'Curated collection of shadcn/ui components',
        licenseType: 'MIT',
        isActive: true,
      },
      {
        name: 'Neobrutalism Components',
        slug: 'neobrutalism',
        url: 'https://www.neobrutalism.dev',
        description: 'Neobrutalist design components for shadcn/ui',
        licenseType: 'MIT',
        isActive: true,
      },
    ]).returning();

    console.log(`✅ Seeded ${sources.length} source websites`);

    // Seed component types
    const types = await db.insert(componentTypes).values([
      { name: 'Button', slug: 'button', description: 'Interactive button components', displayOrder: 1 },
      { name: 'Card', slug: 'card', description: 'Container card components', displayOrder: 2 },
      { name: 'Form', slug: 'form', description: 'Form input and control components', displayOrder: 3 },
      { name: 'Navigation', slug: 'navigation', description: 'Navigation and menu components', displayOrder: 4 },
      { name: 'Modal', slug: 'modal', description: 'Modal and dialog components', displayOrder: 5 },
      { name: 'Table', slug: 'table', description: 'Data table components', displayOrder: 6 },
      { name: 'Chart', slug: 'chart', description: 'Data visualization components', displayOrder: 7 },
      { name: 'Layout', slug: 'layout', description: 'Layout and container components', displayOrder: 8 },
      { name: 'Typography', slug: 'typography', description: 'Text and typography components', displayOrder: 9 },
      { name: 'Avatar', slug: 'avatar', description: 'User avatar components', displayOrder: 10 },
      { name: 'Badge', slug: 'badge', description: 'Badge and tag components', displayOrder: 11 },
      { name: 'Alert', slug: 'alert', description: 'Alert and notification components', displayOrder: 12 },
      { name: 'Progress', slug: 'progress', description: 'Progress and loading components', displayOrder: 13 },
      { name: 'Tabs', slug: 'tabs', description: 'Tab navigation components', displayOrder: 14 },
      { name: 'Accordion', slug: 'accordion', description: 'Collapsible content components', displayOrder: 15 },
      { name: 'Select', slug: 'select', description: 'Dropdown select components', displayOrder: 16 },
      { name: 'Slider', slug: 'slider', description: 'Range slider components', displayOrder: 17 },
      { name: 'Switch', slug: 'switch', description: 'Toggle switch components', displayOrder: 18 },
      { name: 'Tooltip', slug: 'tooltip', description: 'Tooltip and popover components', displayOrder: 19 },
      { name: 'Hero', slug: 'hero', description: 'Hero section components', displayOrder: 20 },
    ]).returning();

    console.log(`✅ Seeded ${types.length} component types`);

    console.log('✅ Database seeding completed successfully');

    // Close the connection
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await sql.end();
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch(console.error);
}

export { seed };