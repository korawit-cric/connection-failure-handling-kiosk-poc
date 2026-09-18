import prisma from '../src/index';

async function main() {
  // Example seed data
  const links = [
    {
      url: 'https://turborepo.com/docs/getting-started/installation',
      title: 'Installation',
      description: 'Get started with Turborepo in a few moments',
    },
    {
      url: 'https://turborepo.com/docs/crafting-your-repository',
      title: 'Crafting',
      description: 'Architecting a monorepo is a careful process.',
    },
    {
      url: 'https://turborepo.com/docs/getting-started/add-to-existing-repository',
      title: 'Add Repositories',
      description:
        'Turborepo can be incrementally adopted in any repository, single or multi-package, to speed up the developer and CI workflows of the repository.',
    },
  ];

  // Use createMany with skipDuplicates to avoid errors if records already exist
  await prisma.link.createMany({
    data: links,
    skipDuplicates: true,
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
