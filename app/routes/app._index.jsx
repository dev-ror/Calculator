import { useState } from "react";
import { authenticate } from "../shopify.server";
import styles from "../app.module.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

const faqs = [
  ["What is the difference between Shipping Rates and Shipping Customizations?", "Shipping Rates calculate a price at checkout. Shipping Customizations rename, reorder, or hide the delivery options your customers see."],
  ["I need help in setting up the app.", "Choose Talk to agent now for live help, or schedule a convenient onboarding session with our setup team."],
  ["My requirements don't meet.", "Contact support with your exact shipping workflow. We can help design a rule set or suggest a practical alternative."],
  ["Do I need CCS in order for this app to work?", "Carrier-calculated shipping is required for live calculated rates. Customizations can still work independently on eligible plans."],
  ["I want to avoid doubling of shipping charges which occurs because of multiple origins.", "Create a combined-rate rule and choose how rates from multiple fulfillment locations should be merged."],
];

export default function Index() {
  const [openFaq, setOpenFaq] = useState(null);
  const notify = (message) => window.shopify?.toast?.show(message);

  return (
    <s-page heading="Shipping calculator: ShipMagic" inlineSize="large">
      <div className={styles.home}>
        <h2>Get started</h2>
        <section className={styles.card}>
          <h3>Get a free onboarding session</h3>
          <p>Reach out to our live chat and get a free onboarding session where we will help you set up the app quickly.</p>
          <div className={styles.review}>
            <div className={styles.stars}>☆ ☆ ☆ ☆ ☆</div>
            <em>“The support is amazing, fast, responsive and accurate. They take time to understand your exact need and are pro-active at helping.”<br />~ Jacob Miller (Durant Cricket)</em>
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} onClick={() => notify("An agent will be with you shortly")}>Talk to agent now</button>
            <button onClick={() => notify("Onboarding request scheduled")}>Schedule for later</button>
          </div>
        </section>

        <section className={styles.card}>
          <h3>Learn how to setup the app yourself</h3>
          <p>Explore the instructional videos to learn how to set up the app yourself.</p>
          <a className={styles.primaryLink} href="/app/videos">Watch videos</a>
        </section>

        <h2>FAQs</h2>
        <section className={`${styles.card} ${styles.faqCard}`}>
          {faqs.map(([question, answer], index) => (
            <div className={styles.faq} key={question}>
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                <span>{index + 1}. {question}</span><span>{openFaq === index ? "⌃" : "⌄"}</span>
              </button>
              {openFaq === index && <p>{answer}</p>}
            </div>
          ))}
        </section>
        <footer>Reach out to <a href="mailto:support@shipmagic.app">support</a> | Speedy Squirrel Apps</footer>
      </div>
    </s-page>
  );
}
