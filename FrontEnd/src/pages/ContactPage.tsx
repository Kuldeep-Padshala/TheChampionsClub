import React, { useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { CLUB_INFO } from '../constants/club';
import api from '../api/client';
import toast from 'react-hot-toast';
import { MapPin, Phone, Mail, Clock, CheckCircle, RotateCw, Send } from 'lucide-react';

export const ContactPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('General Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email || !message) {
      toast.error('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await api.post('/public/enquiries', {
        full_name: fullName,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        enquiry_type: topic,
        message: message.trim(),
      });

      toast.success('Your enquiry has been received! Our front desk team will contact you shortly.');
      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 8000);
    } catch (err: any) {
      console.error('[ContactPage Enquiry]', err);
      toast.error(err?.response?.data?.message || 'Unable to send enquiry. Please try calling us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contact detail cards
  const contactDetails = [
    {
      icon: MapPin,
      label: 'Address',
      value: CLUB_INFO.address,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: CLUB_INFO.phone,
    },
    {
      icon: Mail,
      label: 'Email',
      value: CLUB_INFO.email,
    },
    {
      icon: Clock,
      label: 'Opening Hours',
      value: CLUB_INFO.hours,
    },
  ];

  return (
    <PageLayout>

      {/* ── Hero ── */}
      <div className="bg-navy-primary text-cream pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Have a question about memberships, court booking, or event hosting?
            We'd love to hear from you — drop us a message and we'll respond within 24 hours.
          </p>
        </div>
      </div>

      {/* ── Main content: info + form ── */}
      <div className="container mx-auto px-4 md:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">

          {/* Left column: contact details */}
          <div>
            <SectionHeader title="Club Information" className="mb-8" />

            {/* Contact cards */}
            <div className="space-y-5">
              {contactDetails.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-bg-subtle rounded-full flex items-center justify-center flex-shrink-0 border border-border">
                    <Icon className="text-gold-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1D1D1F] dark:text-white text-sm mb-0.5">{label}</h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Embedded map */}
            <div className="mt-8 rounded-xl overflow-hidden border border-border">
              <iframe
                src="https://maps.google.com/maps?q=Koramangala+Bengaluru&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="The Champions Club map"
              />
            </div>
          </div>

          {/* Right column: enquiry form */}
          <div className="bg-bg-surface p-8 rounded-2xl border border-border shadow-sm">
            <h3 className="text-2xl font-display font-bold text-[#1D1D1F] dark:text-white mb-2">
              Send an Enquiry
            </h3>
            <p className="text-sm text-text-secondary mb-7">
              Fill in the form and a member of our team will get back to you shortly.
            </p>

            {/* Success confirmation */}
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <CheckCircle className="text-green-600 mx-auto mb-3" size={40} />
                <h4 className="font-bold text-green-800 text-lg mb-1">Message Sent!</h4>
                <p className="text-sm text-green-700">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              /* Enquiry form */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">First Name *</label>
                    <input
                      required
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Rohit"
                      className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Email *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle"
                  />
                </div>

                {/* Topic / interest */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">I'm interested in</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle cursor-pointer"
                  >
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Membership Information">Membership Information</option>
                    <option value="Court Booking Issue">Court Booking Issue</option>
                    <option value="Corporate / Group Booking">Corporate / Group Booking</option>
                    <option value="Event Hosting">Event Hosting</option>
                    <option value="Pro Shop Query">Pro Shop Query</option>
                    <option value="Coaching Programs">Coaching Programs</option>
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1D1D1F] dark:text-white">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help you..."
                    className="w-full p-3 rounded-lg border border-border focus:ring-2 focus:ring-gold-primary outline-none text-sm bg-bg-subtle resize-none"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Sending Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Enquiry</span>
                    </>
                  )}
                </Button>

                <p className="text-xs text-text-secondary text-center">
                  We respond to all enquiries within 24 hours on business days.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>

    </PageLayout>
  );
};
