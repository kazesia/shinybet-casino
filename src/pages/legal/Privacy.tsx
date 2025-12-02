export default function Privacy() {
  return (
    <div className="container py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-muted-foreground">
        <p>Last updated: March 2025</p>
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">1. Information Collection</h2>
          <p>We collect information you provide directly to us, such as when you create an account, make a deposit, or contact customer support.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">2. Use of Information</h2>
          <p>We use the information we collect to operate, maintain, and improve our services, and to communicate with you.</p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-white">3. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access.</p>
        </section>
      </div>
    </div>
  );
}
