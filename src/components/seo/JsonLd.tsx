

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Server component that safely renders JSON-LD structured data into the page HEAD / HTML body.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  const jsonString = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
