import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Order Tracking',
    description: 'Log and monitor customer orders directly from WhatsApp conversations.'
  },
  {
    title: 'Expense Tracking',
    description: 'Record business costs and keep every purchase categorized in one place.'
  },
  {
    title: 'Customer Management',
    description: 'Keep purchase history, notes, and conversation context attached to every customer.'
  },
  {
    title: 'AI Customer Service',
    description: 'Automated replies handle common questions while you stay focused on the business.'
  },
  {
    title: 'Built for WhatsApp',
    description: 'Your customers keep using the chat app they already know. No new app to learn.'
  },
  {
    title: 'Smart Notifications',
    description: 'Send payment reminders and order updates at the right moment without manual follow-up.'
  }
];

const steps = [
  'Connect your WhatsApp workflow and business context.',
  'AI handles replies, order follow-up, and repeat questions.',
  'You track every customer, order, and expense from one simple dashboard.'
];

const proof = [
  {
    value: '500+',
    label: 'businesses ready to scale on WhatsApp'
  },
  {
    value: '10,000+',
    label: 'orders tracked through chat-first workflows'
  },
  {
    value: '24/7',
    label: 'response coverage for customer questions'
  }
];

function FeatureIcon({ index }) {
  const icons = [
    <>
      <path d="M5.5 7.75h13v9.5H9.3L5.5 21V7.75Z" />
      <path d="M8 9.75h8" />
      <path d="M8 12.75h4.5" />
      <path d="M8 15.75h6" />
    </>,
    <>
      <path d="M6.5 5.75h11v12.5h-11z" />
      <path d="M8.25 8.25h7.5" />
      <path d="M8.25 11h7.5" />
      <path d="M8.25 13.75h4.5" />
    </>,
    <>
      <circle cx="12" cy="8.5" r="2.5" />
      <path d="M7.25 19c.75-3 2.55-4.5 4.75-4.5s4 .75 4.75 4.5" />
      <path d="M15.5 10.5h2" />
      <path d="M17 8.5v2" />
    </>,
    <>
      <path d="M12 5.5l1.5 3.25 3.5.5-2.5 2.25.6 3.55L12 13.8 8.9 15.05l.6-3.55L7 9.25l3.5-.5L12 5.5Z" />
      <path d="M18.5 8.5l.8 1.75 1.9.28-1.35 1.22.32 1.9-1.67-.7-1.68.7.32-1.9-1.35-1.22 1.9-.28.81-1.75Z" />
    </>,
    <>
      <path d="M6 9.5c0-2 2.7-3.75 6-3.75s6 1.75 6 3.75-2.7 3.75-6 3.75c-.6 0-1.17-.05-1.7-.15L7 15v-2.1C6.4 12 6 10.85 6 9.5Z" />
      <path d="M9 9.25h6" />
      <path d="M9 11.25h3.5" />
    </>,
    <>
      <path d="M7 15.25V9.5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v3.5c0 1.1-.9 2-2 2H11l-4 2.25Z" />
      <path d="M8.75 10.75h6.5" />
      <path d="M8.75 13h4.2" />
    </>
  ];

  return (
    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[index]}
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="landing-shell">
      <header className="site-nav">
        <Link to="/" className="brand-mark" aria-label="WhatsAppAI home">
          <span className="brand-dot" aria-hidden="true" />
          <span>WhatsAppAI</span>
        </Link>

        <Link to="/demo" className="nav-demo-btn">
          Try Demo
        </Link>
      </header>

      <section className="landing-hero">
        <div className="hero-copy-block reveal stagger-1">
          <div className="hero-pill">WhatsAppAI for small business owners</div>
          <h1>Run your business smarter where your customers already are.</h1>
          <p className="hero-lead">
            WhatsAppAI helps shops, food businesses, freelancers, and service providers manage orders,
            customers, expenses, and AI replies without forcing customers into a new app.
          </p>
          <div className="hero-actions">
            <Link to="/demo" className="primary-cta">
              See the Demo
            </Link>
            <p className="cta-note">Built for WhatsApp-first businesses in emerging markets.</p>
          </div>
        </div>

        <div className="phone-mockup reveal stagger-2" aria-label="WhatsApp style chat preview">
          <div className="phone-screen">
            <div className="phone-topbar">
              <span className="signal-dots" />
              <span>WhatsAppAI</span>
              <span className="tick-row">✓✓</span>
            </div>
            <div className="chat-thread">
              <div className="chat-bubble incoming">Do you still have the blue dress in medium?</div>
              <div className="chat-bubble outgoing">Yes, 3 left. I can reserve one now and send the delivery details.</div>
              <div className="chat-bubble incoming">Perfect, please add it to my order.</div>
              <div className="chat-bubble outgoing accent">Order tracked. Customer profile updated. Payment reminder queued.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading reveal">
          <p className="section-kicker">Core features</p>
          <h2>Everything you need to run a WhatsApp business, without the spreadsheet chaos.</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article className={`feature-card reveal stagger-${(index % 3) + 1}`} key={feature.title}>
              <FeatureIcon index={index} />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block split-block">
        <article className="panel-light reveal stagger-1">
          <p className="section-kicker">How it works</p>
          <h2>Simple enough for a busy owner, smart enough to save hours every week.</h2>
          <div className="steps-list">
            {steps.map((step, index) => (
              <div className="step-item" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-light trust-panel reveal stagger-2">
          <p className="section-kicker">Social proof</p>
          <h2>Designed to feel familiar, trusted, and ready for real customer volume.</h2>
          <div className="proof-grid">
            {proof.map((item) => (
              <div className="proof-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="final-cta reveal">
        <div>
          <p className="section-kicker">Try it in action</p>
          <h2>See how WhatsAppAI turns every chat into a tracked business workflow.</h2>
        </div>
        <Link to="/demo" className="primary-cta large">
          Try the Demo
        </Link>
      </section>

      <footer className="page-footer">
        <p className="footer-copy">© 2026 WhatsAppAI. Smarter customer management, order tracking, and AI support for WhatsApp-first businesses.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#contact">Contact</a>
          <a href="#twitter">Twitter</a>
        </div>
      </footer>
    </main>
  );
}