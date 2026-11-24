import Image from "next/image";
import Link from "next/link";
import { LandingShell } from "@/components/landing/pages";
import { pageMetadata } from "@/lib/seo";

// Every question, answer, number and query below was copied from Kakaw's
// production app on 2026-11-24 (Demo Store sample database, gemini-4-carbon).
// Replace an example only with another real run; never edit the numbers.

export const metadata = pageMetadata({
  title: "Examples: Real Questions and Kakaw's Answers",
  description:
    "Real questions asked in plain English on a sample e-commerce database, with Kakaw's answers, result tables, charts and the SQL it wrote.",
  path: "/examples",
});

const card = "rounded-xl border border-border bg-surface-container-lowest p-6 sm:p-8";
const q = "font-headline text-xl sm:text-2xl text-on-surface";
const label = "font-mono text-xs uppercase tracking-[0.12em] text-on-surface-variant";
const pre = "overflow-x-auto rounded-lg bg-surface-container p-4 font-mono text-xs leading-relaxed text-on-surface";

function Table({ head, rows, numeric }: { head: string[]; rows: (string | number)[][]; numeric: boolean[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-container">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-4 py-2 font-mono text-xs uppercase tracking-wide text-on-surface-variant ${numeric[i] ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-t border-border">
              {row.map((cell, i) => (
                <td key={i} className={`px-4 py-2 ${numeric[i] ? "text-right font-mono tabular-nums" : ""}`}>
                  {typeof cell === "number" ? cell.toLocaleString("en-US") : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOP_PRODUCTS_SQL = `WITH
  quarter_bounds AS (
    SELECT
      date(strftime('%Y-01-01', max_date),
        '+' || (((CAST(strftime('%m', max_date) AS INTEGER) - 1) / 3) * 3 - 3) || ' months') AS prev_quarter_start,
      date(strftime('%Y-01-01', max_date),
        '+' || (((CAST(strftime('%m', max_date) AS INTEGER) - 1) / 3) * 3) || ' months') AS curr_quarter_start
    FROM (SELECT MAX(created_at) AS max_date FROM orders)
  )
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  COALESCE(SUM(oi.total), 0) AS total_revenue,
  COALESCE(SUM(oi.quantity), 0) AS units_sold
FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  CROSS JOIN quarter_bounds qb
WHERE date(o.created_at) >= qb.prev_quarter_start
  AND date(o.created_at) < qb.curr_quarter_start
  AND LOWER(o.status) NOT IN ('refunded', 'cancelled')
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 5;`;

const ORDERS_SQL = `SELECT
  strftime('%Y-%m', created_at) AS order_month,
  COUNT(id) AS order_count
FROM orders
WHERE strftime('%Y', created_at) = strftime('%Y', 'now')
GROUP BY order_month
ORDER BY order_month ASC`;

export default function ExamplesPage() {
  return (
    <LandingShell
      eyebrow="Examples"
      h1="Real questions, real answers"
      intro="Every example here was asked in plain English on a sample e-commerce database, with Google's gemini-4-carbon model, on November 24, 2026. The answers, numbers, charts and SQL are shown as Kakaw returned them, with only the punctuation of the bullet points changed. The data is generated test data, which is why some product names read oddly."
      path="/examples"
    >
      <div className="space-y-10">
        <section className={card} aria-labelledby="ex-text">
          <p className={label}>Answer and table</p>
          <h2 id="ex-text" className={`${q} mt-2 mb-5`}>Which 5 products made the most revenue last quarter?</h2>
          <div className="space-y-3 text-on-surface-variant leading-relaxed mb-6">
            <p>
              The top 5 revenue-generating products brought in a combined $60,408.19, led significantly by the
              Geometric Area Rug at $18,348.00.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-on-surface">Clear Leader:</strong> The Geometric Area Rug generated 69% more
                revenue than the second-place Ergonomic Silk Car ($10,857.48) and accounted for nearly half of all units
                sold across the top five (132 out of 270 total units).
              </li>
              <li>
                <strong className="text-on-surface">Tight Runner-Up Cluster:</strong> The remaining four products, such as
                Ergonomic Silk Car and Frozen Silk Tuna ($10,696.74), clustered closely together, ranging from $10,057.78 to $10,857.48 in revenue with much lower sales
                volumes (32 to 39 units each).
              </li>
            </ul>
          </div>
          <Table
            head={["Product name", "SKU", "Total revenue", "Units sold"]}
            numeric={[false, false, true, true]}
            rows={[
              ["Geometric Area Rug", "SKU-HD70716", 18348, 132],
              ["Ergonomic Silk Car", "SKU-FVVIL5VE", 10857.48, 32],
              ["Frozen Silk Tuna", "SKU-PEEPA61U", 10696.74, 32],
              ["Recycled Silk Chicken", "SKU-EG27ZJ76", 10448.19, 39],
              ["Small Plastic Computer", "SKU-MXX3OGZJ", 10057.78, 35],
            ]}
          />
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-on-surface">The SQL Kakaw wrote</summary>
            <pre className={`${pre} mt-3`}>{TOP_PRODUCTS_SQL}</pre>
          </details>
        </section>

        <section className={card} aria-labelledby="ex-follow">
          <p className={label}>A follow-up that becomes a chart</p>
          <h2 id="ex-follow" className={`${q} mt-2 mb-5`}>How much revenue did Home Decor make each month last quarter?</h2>
          <p className="text-on-surface-variant leading-relaxed mb-5">
            Home Decor generated a total of 79,595 in revenue across the 3 months of the quarter, peaking in September
            2026 at 34,634.
          </p>
          <Table
            head={["Order month", "Total revenue"]}
            numeric={[false, true]}
            rows={[
              ["2026-07", 19169],
              ["2026-08", 25792],
              ["2026-09", 34634],
            ]}
          />
          <p className={`${q} mt-8 mb-4 text-lg sm:text-xl`}>Show that as a bar chart</p>
          <p className="text-on-surface-variant leading-relaxed mb-5">
            Home Decor revenue climbed steadily each month last quarter, nearly doubling from 19,169 in July 2026 to a
            peak of 34,634 in September 2026.
          </p>
          <Image
            src="/examples/home-decor-monthly-bar.png"
            width={1538}
            height={836}
            alt="Kakaw's bar chart 'Total Revenue by Order Month': July 2026 19,169, August 25,792, September 34,634"
            sizes="(min-width: 768px) 640px, 100vw"
            className="w-full h-auto rounded-lg border border-border"
          />
        </section>

        <section className={card} aria-labelledby="ex-line">
          <p className={label}>A line chart on request</p>
          <h2 id="ex-line" className={`${q} mt-2 mb-5`}>How many orders were placed each month this year? Show it as a line chart.</h2>
          <div className="space-y-3 text-on-surface-variant leading-relaxed mb-6">
            <p>
              Across the 11 recorded months of 2026, monthly orders totaled 5,323, peaking at 607 in September before
              dropping to a low of 351 in November.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-on-surface">Upward Summer Trend:</strong> After fluctuating in the spring,
                order volume climbed steadily for five consecutive months from April (423) to the yearly high in
                September (607).
              </li>
              <li>
                <strong className="text-on-surface">Autumn Decline:</strong> Following the September peak, orders fell
                sharply in October (477) and reached the lowest point of the year in November (351).
              </li>
              <li>
                <strong className="text-on-surface">Overall Average:</strong> Monthly order volume averaged roughly 484
                orders across the 11-month period, with other top-performing months including August (560) and July
                (520).
              </li>
            </ul>
          </div>
          <Image
            src="/examples/orders-by-month-line.png"
            width={1538}
            height={836}
            alt="Kakaw's line chart 'Order Count by Order Month' for January to November 2026, peaking at 607 in September"
            sizes="(min-width: 768px) 640px, 100vw"
            className="w-full h-auto rounded-lg border border-border"
          />
          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-on-surface">The SQL Kakaw wrote</summary>
            <pre className={`${pre} mt-3`}>{ORDERS_SQL}</pre>
          </details>
        </section>

        <section className={card} aria-labelledby="ex-ask">
          <p className={label}>When a question is unclear, Kakaw asks</p>
          <h2 id="ex-ask" className={`${q} mt-2 mb-5`}>Who are our best customers?</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">How would you like to define your best customers?</p>
          <ul className="flex flex-col gap-2">
            {[
              "Who are our top customers by total amount spent?",
              "Who are our top customers by number of orders?",
              "Who are our top customers by highest average order value?",
            ].map((choice) => (
              <li key={choice} className="rounded-lg border border-border px-4 py-2 text-sm text-on-surface">
                {choice}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-on-surface-variant">
            Kakaw offers the readings as buttons instead of guessing. See{" "}
            <Link href="/docs/how-it-works" className="underline underline-offset-4">
              How it works
            </Link>
            .
          </p>
        </section>
      </div>

      <div className="mt-16 flex flex-wrap gap-4">
        <Link href="/login" className="pod-btn px-8 py-4 text-base">
          Ask your own database
        </Link>
        <Link href="/docs/chat/asking-questions" className="pod-btn-ghost px-8 py-4 text-base">
          How to ask good questions
        </Link>
      </div>
    </LandingShell>
  );
}
