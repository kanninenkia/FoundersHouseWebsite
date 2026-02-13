import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NavBar, Footer } from '../components/layout';
import './page.css';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy — Founders House';
  }, []);

  return (
    <div className="legal-page">
      <NavBar logoColor="dark" hamburgerColor="#fff" streakColor="#D82E11" />
      
      <main className="legal-content">
        <div className="legal-container">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: February 13, 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Founders House Ry ("we," "our," or "us"). We are committed to protecting 
              your personal data and respecting your privacy. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you visit our website 
              and use our services.
            </p>
            <p>
              <strong>Data Controller:</strong><br />
              Founders House Ry<br />
              Helsinki, Finland<br />
              Email: privacy@foundershouse.fi
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <p>We may collect information that you voluntarily provide to us, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Membership application information</li>
              <li>Event registration details</li>
              <li>Communication preferences</li>
              <li>Any other information you choose to provide through contact forms or correspondence</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you visit our website, we automatically collect certain information, including:</p>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited, time spent on pages, and navigation patterns</li>
              <li>Referring website addresses</li>
              <li>Date and time of visits</li>
            </ul>

            <h3>2.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to enhance your experience. 
              For detailed information about our cookie usage, please see our{' '}
              <Link to="/cookies">Cookie Settings</Link> page.
            </p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li><strong>Service Delivery:</strong> To provide and maintain our services, process membership applications, and manage event registrations</li>
              <li><strong>Communication:</strong> To send you updates, newsletters, and respond to your inquiries</li>
              <li><strong>Analytics:</strong> To understand how visitors use our website and improve user experience</li>
              <li><strong>Marketing:</strong> To send you promotional content (with your consent)</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          <section>
            <h2>4. Legal Basis for Processing (GDPR)</h2>
            <p>Under the General Data Protection Regulation (GDPR), we process your personal data based on:</p>
            <ul>
              <li><strong>Consent:</strong> You have given clear consent for us to process your personal data for specific purposes</li>
              <li><strong>Contract:</strong> Processing is necessary for a contract we have with you, or to take steps at your request before entering a contract</li>
              <li><strong>Legal Obligation:</strong> Processing is necessary for compliance with legal obligations</li>
              <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests or those of a third party, provided your rights don't override these interests</li>
            </ul>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>We use the following third-party services that may collect and process your data:</p>
            
            <h3>Google Analytics</h3>
            <p>
              We use Google Analytics to analyze website traffic and usage patterns. Google Analytics 
              uses cookies to collect anonymous information. You can opt-out of Google Analytics by 
              installing the Google Analytics Opt-out Browser Add-on.
            </p>

            <h3>Hotjar</h3>
            <p>
              We use Hotjar for website analytics and user feedback. Hotjar collects information about 
              your device, browser, and interactions with our website to help us improve user experience.
            </p>

            <p>
              These third-party services have their own privacy policies. We recommend reviewing their 
              policies to understand how they handle your data.
            </p>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes outlined 
              in this Privacy Policy, unless a longer retention period is required by law. When we no longer 
              need your data, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2>7. Your Rights Under GDPR</h2>
            <p>As a data subject in the EU, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time (where processing is based on consent)</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with a supervisory authority</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at privacy@foundershouse.fi
            </p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the internet or electronic storage is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries outside the European Economic Area (EEA). 
              When we transfer data internationally, we ensure appropriate safeguards are in place, such as 
              Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under the age of 16. We do not knowingly collect 
              personal data from children. If you believe we have collected data from a child, please contact 
              us immediately.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes 
              by posting the new policy on this page and updating the "Last Updated" date. We encourage you to 
              review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p>
              <strong>Founders House Ry</strong><br />
              Email: privacy@foundershouse.fi<br />
              Address: Helsinki, Finland
            </p>
            <p>
              For GDPR-related inquiries or to exercise your data rights, you can also contact the Finnish 
              Data Protection Ombudsman at <a href="https://tietosuoja.fi" target="_blank" rel="noopener noreferrer">tietosuoja.fi</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
