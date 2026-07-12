import { cn } from "@/lib/utils";

type Props = {
  content: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
};

/** Two-column public listing body: scrollable left content + sticky inquiry card. */
export function PublicListingMainLayout({ content, sidebar, className }: Props) {
  return (
    <div className={cn("listing-main-layout mt-8 lg:mt-10", className)}>
      <div className="listing-left-column">{content}</div>
      <aside className="listing-right-column">{sidebar}</aside>
    </div>
  );
}
