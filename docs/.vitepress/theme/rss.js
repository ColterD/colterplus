import { Feed } from 'feed'
import fs from 'fs'
import path from 'path'
import { createContentLoader } from 'vitepress'

export async function generateRSSFeed(siteConfig) {
  const feed = new Feed({
    title: "ColterPlus",
    description: "My Digital Universe - Curated",
    id: "https://colterplus.com/",
    link: "https://colterplus.com/",
    language: "en",
    image: "https://colterplus.com/logo.png",
    favicon: "https://colterplus.com/favicon.ico",
    copyright: `Copyright © ${new Date().getFullYear()} ColterPlus`,
    generator: "VitePress RSS Generator",
    feedLinks: {
      rss: "https://colterplus.com/feed.xml",
    },
    author: {
      name: "ColterPlus",
      link: "https://colterplus.com"
    }
  })

  // Load blog posts
  const posts = await createContentLoader('blog/*.md', {
    excerpt: true,
    render: true
  }).load()

  // Sort posts by date
  posts.sort((a, b) => {
    return new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
  })

  // Add posts to feed
  for (const post of posts) {
    const url = `https://colterplus.com/blog/${post.url}`
    
    feed.addItem({
      title: post.frontmatter.title,
      id: url,
      link: url,
      description: post.excerpt,
      content: post.html,
      author: [
        {
          name: post.frontmatter.author || "ColterPlus",
          link: "https://colterplus.com"
        }
      ],
      date: new Date(post.frontmatter.date)
    })
  }

  // Write the RSS feed to a file
  const outDir = path.join(siteConfig.outDir, 'feed.xml')
  await fs.promises.writeFile(outDir, feed.rss2())
}

// Helper function to get posts metadata
export async function getPostsMetadata() {
  const posts = await createContentLoader('blog/*.md', {
    excerpt: true,
    render: false
  }).load()

  return posts.map(post => ({
    title: post.frontmatter.title,
    url: post.url,
    excerpt: post.excerpt,
    date: post.frontmatter.date,
    readingTime: getReadingTime(post.content),
    tags: post.frontmatter.tags || []
  }))
}

// Helper function to calculate reading time
function getReadingTime(content) {
  const words = content.match(/\w+/g)?.length ?? 0
  const time = Math.ceil(words / 200) // Assuming 200 words per minute
  return `${time} min read`
}