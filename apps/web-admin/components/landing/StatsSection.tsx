export function StatsSection() {
  return (
    <section className="py-16 bg-background border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/40">
          <div className="flex flex-col items-center justify-center">
            <p className="text-[16px] font-extrabold text-foreground mb-2">2,000+</p>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Organizers</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-[16px] font-extrabold text-foreground mb-2">10,000+</p>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Tournaments</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-[16px] font-extrabold text-foreground mb-2">50,000+</p>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Players</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-[16px] font-extrabold text-foreground mb-2">500+</p>
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Golf Clubs</p>
          </div>
        </div>
      </div>
    </section>
  );
}
