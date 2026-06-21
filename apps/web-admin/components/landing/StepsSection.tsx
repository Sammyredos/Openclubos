export function StepsSection() {
  const steps = [
    {
      number: "1",
      title: "Set Up Your Club",
      description: "Input your course details, add members and your club profile will be up and running fast."
    },
    {
      number: "2",
      title: "Create Tournaments",
      description: "Define format, dates, and pricing. Open registrations and watch your roster fill up."
    },
    {
      number: "3",
      title: "Manage Live Scoring",
      description: "Players enter scores directly from the field. Live leaderboards update instantly for all."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-[16px] md:text-[16px] font-normal text-foreground">
            Get Started in 3 Simple Steps
          </h2>
        </div>

        <div className="max-w-5xl mx-auto relative">
          {/* Horizontal line for desktop */}
          <div className="hidden md:block absolute top-6 left-24 right-24 h-0.5 bg-border border-dashed border-t-2" />
          
          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-landing text-landing-foreground flex items-center justify-center text-[14px] font-normal mb-6 ring-8 ring-background">
                  {step.number}
                </div>
                <h3 className="text-[14px] font-normal text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
