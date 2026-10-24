import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext.jsx';

export const MAPS_LOCATION_URL = "https://maps.app.goo.gl/UMsXzzu46QNMNwcB8";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61575442051109";
export const INSTAGRAM_URL = "https://www.instagram.com/explore/tags/kopaychristiancollege/";

export default function Contact() {
  const { content } = useSiteContent();
  const contact = content?.contact || {};

  const address = contact.address || "J/Kopay Christian College, Kopay, Jaffna, Sri Lanka";
  const phone = contact.phone || "021 223 0040";
  const officeHours = contact.officeHours;
  const email = contact.email || "kcckopay@gmail.com";
  const mapsUrl = contact.mapsUrl || MAPS_LOCATION_URL;
  const facebookUrl = contact.facebookUrl || FACEBOOK_URL;
  const instagramUrl = contact.instagramUrl || INSTAGRAM_URL;

  return (
    <section className="py-6 sm:py-8 bg-brand-white dark:bg-[#0b120c] border-t border-brand-pale dark:border-emerald-950/60 transition-colors" id="contact">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-forest rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 text-brand-white shadow-lg border border-brand-soft/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                  Contact Us
                </h2>
                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-brand-pale mt-0.5 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-semibold text-brand-pale uppercase tracking-wider">
                        Address
                      </span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-brand-pale transition-colors inline-flex items-center gap-1 truncate text-xs group"
                      >
                        <span className="truncate">{address}</span>
                        <svg className="w-3 h-3 text-brand-pale/70 shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-brand-pale mt-0.5 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-brand-pale uppercase tracking-wider">
                        Phone
                      </span>
                      <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-semibold text-white hover:text-brand-pale transition-colors text-xs sm:text-sm">
                        {phone}
                      </a>
                     
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-brand-pale mt-0.5 shadow-2xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-brand-pale uppercase tracking-wider">
                        Email
                      </span>
                      <a href={`mailto:${email}`} className="font-semibold text-white hover:text-brand-pale transition-colors text-xs">
                        {email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-3">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Facebook Profile"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Instagram Profile"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Quick Navigation
                </h3>

                <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm">
                  <li>
                    <Link
                      to="/history"
                      className="group inline-flex items-center gap-2.5 text-brand-light/95 hover:text-white transition-colors py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-pale group-hover:scale-125 transition-transform"></span>
                      <span className="font-medium">College History</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/events"
                      className="group inline-flex items-center gap-2.5 text-brand-light/95 hover:text-white transition-colors py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-pale group-hover:scale-125 transition-transform"></span>
                      <span className="font-medium">Events & Posts</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/gallery"
                      className="group inline-flex items-center gap-2.5 text-brand-light/95 hover:text-white transition-colors py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-pale group-hover:scale-125 transition-transform"></span>
                      <span className="font-medium">Photo Gallery</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/anthem"
                      className="group inline-flex items-center gap-2.5 text-brand-light/95 hover:text-white transition-colors py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-pale group-hover:scale-125 transition-transform"></span>
                      <span className="font-medium">School Anthem</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/history?lang=ta"
                      className="group inline-flex items-center gap-2.5 text-brand-light/95 hover:text-white transition-colors py-0.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-pale group-hover:scale-125 transition-transform"></span>
                      <span className="font-medium">Tamil History</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center">
              <div className="w-full max-w-sm rounded-xl overflow-hidden bg-brand-white text-slate-800 shadow-md border border-brand-pale">
                <div className="px-3 py-2 bg-brand-light/80 border-b border-brand-pale flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-brand-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location Map</span>
                  </span>
                </div>

                <div className="relative w-full h-[155px] bg-slate-100">
                  <iframe
                    title="J/Kopay Christian College Location Map"
                    src="https://maps.google.com/maps?q=Kopay+Christian+College+Jaffna&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                </div>

                <div className="px-3 py-1.5 bg-brand-white border-t border-brand-pale/70 flex items-center justify-between gap-2 text-[10px] text-slate-600">
                  <span className="truncate">Point Pedro Rd, Kopay</span>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-forest font-semibold hover:underline shrink-0"
                  >
                    Directions &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
