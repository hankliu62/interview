/* eslint-disable jsx-a11y/label-has-associated-control */
import type { VFileCompatible } from "vfile";
import { useRouter } from "next/router";
import ErrorPage from "next/error";
import { remark } from 'remark';
import html from 'remark-html';
import { join } from "path";
import fs from "fs"
import matter from "gray-matter";
import { InferGetStaticPropsType } from "next";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export type Post = {
  slug?: string;
  title?: string;
  author?: string;
  date?: Date;
  content?: string;
  excerpt?: string;
  html?: string;
  [key: string]: any;
};

const postsDirectory = join(process.cwd(), "markdown");

async function markdownToHtml(markdown: VFileCompatible) {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

/**
 * 获得面试题内容
 *
 * @param slug
 * @returns
 */
function getPostBySlug(slug: string): Post {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return { content, slug: realSlug };
}

function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug));

  return posts;
}

/**
 * 面试题目
 *
 * @returns
 */
export default function PostPage({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <div className="bg-white p-6">
      <div className="flex flex-col space-y-6">
        <article>
          <header>
            <h1 className="text-4xl font-bold">{post.title}</h1>
          </header>

          <div>
            <MDEditor
              value={post.content}
              visibleDragbar={false}
              fullscreen
              hideToolbar
              preview="preview"
            />
          </div>
        </article>
      </div>
    </div>
  );
}

type Params = {
  params: {
    slug: string;
  };
};

export async function getStaticProps({ params }: Params) {
  const post = getPostBySlug(params.slug);
  const content = await markdownToHtml(post.content || "");

  return {
    props: {
      post: {
        ...post,
        html: content,
      },
    },
  };
}

export async function getStaticPaths() {
  const posts = getAllPosts();

  return {
    paths: posts.map(({ slug }) => {
      return {
        params: {
          slug,
        },
      };
    }),
    fallback: false,
  };
}
