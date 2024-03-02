import { MarkdownPreviewProps } from "@uiw/react-markdown-preview/lib/Props";
import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, useState } from "react";

const MDPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

export interface SkeletonParagraphProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string | Array<number | string>;
  rows?: number;
}

const Paragraph = (props: SkeletonParagraphProps) => {
  const getWidth = (index: number) => {
    const { width, rows = 2 } = props;
    if (Array.isArray(width)) {
      return width[index];
    }
    // last paragraph
    if (rows - 1 === index) {
      return width;
    }
    return undefined;
  };

  const { className, style, rows } = props;
  // eslint-disable-next-line unicorn/no-useless-spread, unicorn/no-new-array
  const rowList = [...new Array(rows)].map((_, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <li key={index} style={{ width: getWidth(index) }} />
  ));
  return (
    <ul className={className} style={style}>
      {rowList}
    </ul>
  );
};

export interface SkeletonProps {
  active?: boolean;
}

const Skeleton = ({ active }: SkeletonProps) => (
  <div className={`skeleton ${active ? 'skeleton-active' : ''}`}>
    <div className="skeleton-content">
      <h3 className="skeleton-title" aria-hidden></h3>
      <Paragraph className="skeleton-paragraph" />
    </div>
  </div>
)

export interface IMarkdownPreviewProps extends MarkdownPreviewProps {
  onLoad?: () => void; // MDPreview渲染完成
  showLoading?: boolean;
}

export default function MarkdownPreview({
  onLoad,
  showLoading,
  ...otherProps
}: IMarkdownPreviewProps) {
  // 是否已经触发Load事件
  const loaded = useRef<boolean>(false);

  const rootElement = useRef<HTMLDivElement|null>(null);

  // 是否正在渲染Markdown预览器
  const [loadingMarkdownPreview, setLoadingMarkdownPreview] =
    useState<boolean>(true);

  useLayoutEffect(() => {
    function checkMDPreviewLoaded() {
      const preview = rootElement.current?.querySelectorAll(".wmde-markdown");
      if (preview && preview.length > 0) {
        if (!loaded.current) {
          setLoadingMarkdownPreview(false);
          onLoad && onLoad();
        }

        loaded.current = true;
      } else {
        setTimeout(checkMDPreviewLoaded, 1000);
      }
    }

    checkMDPreviewLoaded();
  }, [onLoad]);

  return (
    <div ref={rootElement}>
      <MDPreview {...otherProps} />
      {showLoading && loadingMarkdownPreview && <Skeleton active />}
    </div>
  );
}
