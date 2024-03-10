/* eslint-disable jsx-a11y/label-has-associated-control */
import fs from "node:fs"
import { join } from "node:path";

import matter from "gray-matter";
import { InferGetStaticPropsType } from "next";
import ErrorPage from "next/error";
import { useRouter } from "next/router";

import MarkdownPreview from "@/components/MarkdownPreview";

export type Post = {
  slug?: string;
  title?: string;
  author?: string;
  date?: Date;
  content?: string;
  excerpt?: string;
  html?: string;
};

const postsDirectory = join(process.cwd(), "markdown");

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
  const { content } = matter(fileContents);

  return { content, slug: realSlug };
}

/**
 * 面试题目
 *
 * @returns
 */
export default function HomePage({
  post,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();

  const preview = router.query?.preview;

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <div className={`bg-white p-6 ${preview ? 'preview-container' : ''}`}>
      <div className="flex flex-col space-y-6">
        <article>
          <header>
            <h1 className="text-4xl font-bold">{post.title}</h1>
          </header>

          <div>
            <MarkdownPreview
              source={post.content}
              showLoading
            />
          </div>
        </article>
      </div>
    </div>
  );
}


export async function getStaticProps() {
  const post = getPostBySlug("interview");

  return {
    props: {
      post: {
        ...post,
      },
    },
  };
}

