import { getCollection } from 'astro:content';

export async function GET() {
  const notes = await getCollection('notes');
  const index = notes
    .filter(n => n.data.categorySlug !== 'root')
    .map(n => ({
      title: n.data.title,
      slug: n.slug,
      category: n.data.category,
      categorySlug: n.data.categorySlug,
    }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
