/**
 * The organization's own contact details.
 *
 * Single source of truth: the address and phone used to be copy-pasted into the
 * footer, the home page, the about page and the contact page, so a move meant
 * four edits and a good chance of missing one. They are also fed to the site
 * assistant's knowledge base (src/lib/chat-kb.ts), which is only allowed to
 * quote details that come from the site's own data.
 */

export const org = {
  /** Street line and city line are separate so the footer can stack them. */
  addressLine1: '981 S. Western Ave. #406',
  addressLine2: 'Los Angeles, CA 90006',

  /** As written for people to read. */
  phoneDisplay: '(424) 253-5558',
  /** As dialled — used for the tel: link. */
  phoneHref: '+14242535558',

  /**
   * PLACEHOLDER: no real inbox exists yet. Rendered with `.placeholder-tag`
   * styling so it is obvious on the page that it still needs replacing.
   */
  email: 'help@crcenter.org',
  emailIsPlaceholder: true,
} as const;

/** One-line form, e.g. for the assistant and meta descriptions. */
export const orgAddress = `${org.addressLine1}, ${org.addressLine2}`;

/** Opens the office in whichever map app the visitor has. */
export const orgMapUrl = `https://maps.google.com/?q=${encodeURIComponent(orgAddress)}`;
