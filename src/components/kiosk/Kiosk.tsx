import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Clock3, Minus, Plus, Printer, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { CATEGORIES, LOGO_URL, MENU, STORE_URL, fromPrice, rupee, type Category, type MenuItem } from "@/lib/menu";
import { OWNER_WHATSAPP, orderText, type CartLine, type NotifyResult, type Order } from "@/lib/order-types";
import { notifyOwner } from "@/lib/notify.functions";
import { placeOrder as submitOrder } from "@/lib/orders.functions";

type Step = "welcome" | "menu" | "review" | "type" | "details" | "payment" | "done";

export function Kiosk({ menu }: { menu: MenuItem[] }) {
  const [step, setStep] = useState<Step>("welcome");
  const [cart, setCart] = useState<CartLine[]>([]);
  const clientRef = useRef<string | null>(null);
  const [placeError, setPlaceError] = useState("");
  const [orderType, setOrderType] = useState<Order["type"] | null>(null);
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<Order["payment"] | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [notify, setNotify] = useState<NotifyResult | null>(null);
  const [placing, setPlacing] = useState(false);
  const sendNotify = useServerFn(notifyOwner);
  const sendOrder = useServerFn(submitOrder);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const add = (item: MenuItem, size: string, price: number, qty: number) => {
    const key = `${item.id}|${size}`;
    setCart((c) => c.some((l) => l.key === key)
      ? c.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      : [...c, { key, itemId: item.id, name: item.name, size, price, qty }]);
  };
  const changeQty = (key: string, d: number) =>
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));
  const remove = (key: string) => setCart((c) => c.filter((l) => l.key !== key));

  const reset = () => {
    clientRef.current = null; setPlaceError("");
    setCart([]); setOrderType(null); setTable(""); setName(""); setPhone("");
    setPayment(null); setOrder(null); setNotify(null); setStep("welcome");
  };

  const placeOrder = async () => {
    if (!orderType || !payment || !cart.length || placing) return;
    setPlacing(true); setPlaceError("");
    clientRef.current ??= crypto.randomUUID();
    try {
    const result = await sendOrder({ data: {
      clientRef: clientRef.current, type: orderType, payment,
      ...(orderType === "Dine In" ? { table } : {}),
      customerName: name, customerPhone: phone,
      lines: cart.map(({ itemId, size, qty }) => ({ itemId, size, qty })),
    } });
    if (!result.ok) { setPlaceError(result.error); return; }
    const o: Order = {
      number: result.number, type: orderType, table: orderType === "Dine In" ? table : undefined,
      customerName: name.trim() || undefined, customerPhone: phone.trim() || undefined,
      lines: cart, subtotal: result.total, total: result.total, payment, createdAt: new Date().toISOString(),
    };
    let res: NotifyResult;
    try { res = await sendNotify({ data: o }); }
    catch (e) { res = { email: "failed", whatsapp: "failed", errors: [String(e)] }; }
    setOrder(o); setNotify(res); setPlacing(false);
    setStep("done");
    } catch { setPlaceError("Could not send your order. Please try again."); }
    finally { setPlacing(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground select-none">
      {step === "welcome" && <Welcome onStart={() => setStep("menu")} />}
      {step === "menu" && (
        <MenuScreen menu={menu} cart={cart} subtotal={subtotal} count={count} onAdd={add} onQty={changeQty}
          onRemove={remove} onProceed={() => setStep("review")} onHome={() => setStep("welcome")} />
      )}
      {step === "review" && (
        <Shell title="Order Summary" onBack={() => setStep("menu")} backLabel="Back to menu">
          <CartList cart={cart} onQty={changeQty} onRemove={remove} big />
          <Totals subtotal={subtotal} />
          <BigButton disabled={!cart.length} onClick={() => setStep("type")}>Confirm Order <ArrowRight className="size-8" /></BigButton>
        </Shell>
      )}
      {step === "type" && (
        <Shell title="How would you like your order?" onBack={() => setStep("review")}>
          <div className="grid gap-6 sm:grid-cols-2">
            {(["Dine In", "Takeaway"] as const).map((t) => (
              <Choice key={t} active={orderType === t} onClick={() => setOrderType(t)}>{t}</Choice>
            ))}
          </div>
          {orderType === "Dine In" && (
            <div className="mt-8">
              <h3 className="font-display text-3xl uppercase tracking-wide">Table Number</h3>
              <div className="mt-4 grid grid-cols-5 gap-3 sm:grid-cols-10">
                {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((n) => (
                  <button key={n} onClick={() => setTable(n)}
                    className={`h-16 rounded-2xl border-2 font-display text-2xl transition ${table === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card active:bg-secondary"}`}>{n}</button>
                ))}
              </div>
            </div>
          )}
          <BigButton disabled={!orderType || (orderType === "Dine In" && !table)} onClick={() => setStep("details")}>Continue <ArrowRight className="size-8" /></BigButton>
        </Shell>
      )}
      {step === "details" && (
        <Shell title="Your Details" subtitle="Optional — skip if you like" onBack={() => setStep("type")}>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            <Field label="Mobile Number" value={phone} onChange={(v) => setPhone(v.replace(/[^\d+ ]/g, "").slice(0, 14))} placeholder="98765 43210" inputMode="tel" />
          </div>
          <BigButton onClick={() => setStep("payment")}>{name || phone ? "Continue" : "Skip"} <ArrowRight className="size-8" /></BigButton>
        </Shell>
      )}
      {step === "payment" && (
        <Shell title="Payment" onBack={() => setStep("details")}>
          <div className="mb-8 rounded-3xl border-2 border-primary bg-card p-6 text-center">
            <div className="text-xl uppercase tracking-widest text-muted-foreground">Order Total</div>
            <div className="font-display text-7xl text-primary">{rupee(subtotal)}</div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Choice active={payment === "Cash"} onClick={() => setPayment("Cash")}>Cash</Choice>
            <Choice active={payment === "UPI"} onClick={() => setPayment("UPI")}>UPI</Choice>
          </div>
          {payment === "Cash" && <p className="mt-6 text-center text-2xl font-semibold">Please complete payment at the counter.</p>}
          {payment === "UPI" && (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border p-8 text-center">
              <div className="grid size-48 place-items-center rounded-2xl bg-secondary text-lg text-muted-foreground">UPI QR coming soon</div>
              <p className="text-xl">Please pay by UPI at the counter. Staff will confirm your payment.</p>
            </div>
          )}
          {placeError && <p role="alert" className="mt-4 text-center text-destructive">{placeError}</p>}
          <BigButton disabled={!payment || placing} onClick={placeOrder}>{placing ? "Placing order…" : <>Place Order <Check className="size-8" /></>}</BigButton>
        </Shell>
      )}
      {step === "done" && order && <Confirmation order={order} notify={notify} onNew={reset} />}
      {order && <Receipt order={order} />}
    </div>
  );
}

/* ---------------- Welcome ---------------- */
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <Button variant="ghost" onClick={onStart} className="kiosk-welcome relative flex min-h-svh h-auto w-full flex-col items-center justify-center overflow-hidden whitespace-normal rounded-none py-8 text-center">
      <img src={STORE_URL} alt="" className="absolute inset-0 size-full object-cover opacity-35 blur-[2px] scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
      <div className="relative flex flex-col items-center px-6">
        <img src={LOGO_URL} alt="MYNUS 360 official logo" className="size-40 rounded-full object-contain sm:size-72" />
        <p className="mt-6 font-marker text-3xl text-foreground sm:text-4xl">Welcome to</p>
        <h1 className="font-display text-5xl uppercase leading-none text-primary drop-shadow-[0_4px_0_var(--color-primary-foreground)] sm:text-9xl">Mynus 360</h1>
        <p className="mt-4 text-lg font-extrabold text-foreground sm:text-3xl">GOOD FOOD <span className="text-accent">•</span> GREAT MOOD</p>
        <span className="btn-order mt-8 inline-flex items-center gap-3 rounded-full border-4 border-primary-foreground bg-primary px-6 py-5 font-display text-3xl uppercase text-primary-foreground transition-transform sm:px-14 sm:text-6xl">
          Order Here <ArrowRight className="size-12" strokeWidth={3} />
        </span>
        <p className="mt-8 animate-pulse text-xl font-bold uppercase tracking-[0.25em] text-muted-foreground">Tap to start your order</p>
        <p className="mt-10 text-base text-muted-foreground">Mitha Bazar, Jalandhar</p>
      </div>
    </Button>
  );
}

/* ---------------- Menu ---------------- */
function MenuScreen(props: {
  menu: MenuItem[];
  cart: CartLine[]; subtotal: number; count: number;
  onAdd: (i: MenuItem, size: string, price: number, qty: number) => void;
  onQty: (k: string, d: number) => void; onRemove: (k: string) => void;
  onProceed: () => void; onHome: () => void;
}) {
  const [cat, setCat] = useState<Category | "All">("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<MenuItem | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const items = useMemo(() => {
    const t = q.trim().toLowerCase();
    return props.menu.filter((i) => (cat === "All" || i.category === cat) &&
      (!t || `${i.name} ${i.category} ${i.group ?? ""} ${i.note ?? ""}`.toLowerCase().includes(t)));
  }, [cat, q, props.menu]);

  const handleAdd = (i: MenuItem, size: string, price: number, qty: number) => {
    props.onAdd(i, size, price, qty);
    setOpen(null);
    setFlash(`${qty} × ${i.name} added`);
    setTimeout(() => setFlash(null), 1600);
  };

  const qtyOf = (i: MenuItem) => props.cart.filter((l) => l.itemId === i.id).reduce((s, l) => s + l.qty, 0);
  const quickAdd = (i: MenuItem) => {
    const s = i.sizes[0];
    if (i.sizes.length > 1 || !s) { setOpen(i); return; }
    props.onAdd(i, s.label, s.price, 1);
  };
  const quickMinus = (i: MenuItem) => props.onQty(`${i.id}|${i.sizes[0]?.label ?? ""}`, -1);
  const thumb = (c: Category) => props.menu.find((i) => i.category === c && i.image)?.image;
  const pick = (c: Category | "All") => { setCat(c); document.getElementById("menu-grid")?.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="menu-theme flex h-dvh flex-col bg-background text-foreground lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main id="menu-grid" className="flex-1 overflow-y-auto overflow-x-hidden pb-28 lg:pb-8">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-b-[2rem] bg-foreground px-4 py-3 text-background sm:px-6">
            <button onClick={props.onHome} aria-label="Back to welcome screen" className="flex min-w-0 items-center gap-3 text-left">
              <img src={LOGO_URL} alt="MYNUS 360" className="size-12 shrink-0 rounded-full object-contain sm:size-14" />
              <span className="min-w-0">
                <span className="block truncate font-display text-base text-primary sm:text-lg">GOOD FOOD • GREAT MOOD</span>
                <span className="block truncate text-xs opacity-75">Mitha Bazar, Jalandhar</span>
              </span>
            </button>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <div role="note" aria-label="Your order preparation time: 15–20 mins" className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                <Clock3 aria-hidden="true" className="size-6 shrink-0 text-accent" />
                <span>
                  <span className="block text-[10px] font-semibold leading-tight">Your order preparation time</span>
                  <span className="block text-base font-extrabold leading-tight">15–20 mins</span>
                </span>
              </div>
              <button onClick={() => setDrawer(true)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 font-bold text-primary-foreground lg:hidden">
                <ShoppingBag className="size-5" />Cart ({props.count})
              </button>
            </div>
          </header>
          <section className="px-4 pt-5 sm:px-6">
            <h1 className="font-display text-3xl leading-tight sm:text-5xl">What are you <span className="text-accent">craving</span> today?</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Freshly made favourites, just a tap away!</p>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pizza, momos, shakes..."
                className="h-12 w-full min-w-0 rounded-full border border-border bg-card pl-12 pr-11 text-base shadow-sm outline-none focus:border-primary sm:h-14" />
              {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-2"><X className="size-5" /></button>}
            </div>
          </section>
          <nav aria-label="Categories" className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto px-4 pb-2 sm:px-6">
            {(["All", ...CATEGORIES] as const).map((c) => {
              const src = c === "All" ? undefined : thumb(c);
              const on = cat === c;
              return (
                <button key={c} onClick={() => pick(c)} aria-pressed={on}
                  className={`flex w-[5.5rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2 shadow-sm transition active:scale-95 sm:w-24 ${on ? "border-primary bg-primary" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block size-14 overflow-hidden rounded-xl bg-secondary">
                    {src ? <img src={src} alt="" loading="lazy" className="size-full object-cover" /> : <span className="grid size-full place-items-center font-display text-lg">All</span>}
                  </span>
                  <span className="w-full truncate text-center text-xs font-bold">{c}</span>
                </button>
              );
            })}
          </nav>
          <section className="px-4 pt-4 sm:px-6">
            <h2 className="font-display text-2xl sm:text-3xl">{cat === "All" ? "Your Favourites" : cat}</h2>
            <p className="mb-3 text-sm text-muted-foreground">Good food. Great mood.</p>
            {items.length === 0 ? (
              <div className="grid place-items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
                <p className="font-display text-2xl">No dishes match</p>
                <button onClick={() => { setQ(""); setCat("All"); }} className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">Show all dishes</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {items.map((i) => <FoodCard key={i.id} item={i} qty={qtyOf(i)} onOpen={() => setOpen(i)} onAdd={() => quickAdd(i)} onMinus={() => quickMinus(i)} />)}
              </div>
            )}
          </section>
        </main>
      </div>

      <aside className="hidden w-[400px] shrink-0 flex-col border-l border-border bg-card lg:flex">
        <CartPanel {...props} />
      </aside>

      {/* Small screens: sticky cart bar + drawer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 lg:hidden">
        <button onClick={() => setDrawer(true)} className="flex h-14 w-full items-center justify-between rounded-lg bg-primary px-5 text-primary-foreground">
          <span className="flex items-center gap-2 text-base font-bold"><ShoppingBag className="size-6" /> {props.count} items · View cart</span>
          <span className="font-display text-2xl">{rupee(props.subtotal)} →</span>
        </button>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background/80 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="mt-auto flex max-h-[85vh] flex-col rounded-t-3xl border-t-2 border-primary bg-card" onClick={(e) => e.stopPropagation()}>
            <CartPanel {...props} onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}

      {open && <ProductModal item={open} onClose={() => setOpen(null)} onAdd={handleAdd} />}
      {flash && (
        <div className="alert-pop fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border-2 border-primary-foreground bg-primary px-8 py-4 text-xl font-bold text-primary-foreground glow">
          <Check className="mr-2 inline size-6" />{flash}
        </div>
      )}
    </div>
  );
}

function FoodImage({ item, className = "" }: { item: MenuItem; className?: string }) {
  return item.image
    ? <img src={item.image} alt={item.name} loading="lazy" decoding="async" className={`object-cover ${className}`} />
    : <div className={`grid place-items-center bg-secondary font-display text-2xl text-muted-foreground ${className}`}>MYNUS 360</div>;
}

function VegMark() {
  return <span aria-label="Vegetarian" className="grid size-6 place-items-center rounded-sm border-2 border-veg bg-background"><span className="size-2.5 rounded-full bg-veg" /></span>;
}

function FoodCard({ item, qty, onOpen, onAdd, onMinus }: { item: MenuItem; qty: number; onOpen: () => void; onAdd: () => void; onMinus: () => void }) {
  const sized = item.sizes.length > 1;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <button onClick={onOpen} className="relative aspect-[4/3] overflow-hidden bg-secondary" aria-label={`View ${item.name}`}>
        <FoodImage item={item} className="size-full" />
        <div className="absolute left-2 top-2"><VegMark /></div>
      </button>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <button onClick={onOpen} className="text-left">
          <h3 className="line-clamp-2 text-base font-bold leading-snug sm:text-lg">{item.name}</h3>
          {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
          {sized && <span className="block text-xs text-muted-foreground">{item.sizes.map((s) => s.label).join(" / ")}</span>}
        </button>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-display text-xl text-accent sm:text-2xl">{sized && <span className="mr-1 font-sans text-xs font-normal text-muted-foreground">from</span>}{rupee(fromPrice(item))}</span>
          {qty > 0 && !sized ? (
            <span className="flex shrink-0 items-center rounded-md bg-primary text-primary-foreground">
              <button onClick={onMinus} aria-label={`Remove one ${item.name}`} className="grid size-10 place-items-center"><Minus className="size-4" strokeWidth={3} /></button>
              <span className="w-6 text-center font-bold">{qty}</span>
              <button onClick={onAdd} aria-label={`Add one ${item.name}`} className="grid size-10 place-items-center"><Plus className="size-4" strokeWidth={3} /></button>
            </span>
          ) : (
            <button onClick={onAdd} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground active:scale-95">
              <Plus className="size-4" strokeWidth={3} />Add{sized && qty > 0 ? ` (${qty})` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({ item, onClose, onAdd }: { item: MenuItem; onClose: () => void; onAdd: (i: MenuItem, size: string, price: number, qty: number) => void }) {
  const [sizeIdx, setSizeIdx] = useState(item.sizes.length > 1 ? 1 : 0);
  const [qty, setQty] = useState(1);
  const size = item.sizes[sizeIdx] ?? item.sizes[0];
  if (!size) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-background/85 p-4 backdrop-blur" onClick={onClose}>
      <div className="alert-pop flex max-h-[95vh] w-full max-w-2xl flex-col overflow-y-auto rounded-3xl border-2 border-primary bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <FoodImage item={item} className="h-72 w-full sm:h-96" />
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-14 place-items-center rounded-full bg-background/90"><X className="size-8" /></button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3"><VegMark />{item.note && <span className="text-lg text-muted-foreground">{item.note}</span>}</div>
          <h2 className="mt-2 font-display text-4xl uppercase leading-tight sm:text-5xl">{item.name}</h2>
          {item.sizes.length > 1 && (
            <>
              <h3 className="mt-6 text-lg font-bold uppercase tracking-widest text-muted-foreground">Select size</h3>
              <div className={`mt-3 grid gap-3 ${item.sizes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {item.sizes.map((s, i) => (
                  <button key={s.label} onClick={() => setSizeIdx(i)}
                    className={`rounded-2xl border-2 px-3 py-4 transition ${i === sizeIdx ? "border-primary-foreground bg-primary text-primary-foreground glow" : "border-border bg-background"}`}>
                    <div className="font-display text-2xl uppercase">{s.label}</div>
                    <div className="text-2xl font-extrabold">{rupee(s.price)}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          <h3 className="mt-6 text-lg font-bold uppercase tracking-widest text-muted-foreground">Quantity</h3>
          <div className="mt-3 flex items-center gap-6">
            <QtyBtn onClick={() => setQty((q) => Math.max(1, q - 1))} label="Decrease"><Minus className="size-8" /></QtyBtn>
            <span className="w-14 text-center font-display text-5xl">{qty}</span>
            <QtyBtn onClick={() => setQty((q) => Math.min(20, q + 1))} label="Increase"><Plus className="size-8" /></QtyBtn>
          </div>
          <BigButton onClick={() => onAdd(item, size.label, size.price, qty)}>Add to cart · {rupee(size.price * qty)}</BigButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Cart ---------------- */
function CartPanel(p: { cart: CartLine[]; subtotal: number; onQty: (k: string, d: number) => void; onRemove: (k: string) => void; onProceed: () => void; onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <h2 className="font-display text-4xl uppercase text-primary">Your Order</h2>
        {p.onClose && <button onClick={p.onClose} aria-label="Close cart" className="p-2"><X className="size-8" /></button>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {p.cart.length === 0
          ? <p className="py-16 text-center text-xl text-muted-foreground">Your cart is empty.<br />Tap a dish to add it.</p>
          : <CartList cart={p.cart} onQty={p.onQty} onRemove={p.onRemove} />}
      </div>
      <div className="border-t border-border p-5">
        <Totals subtotal={p.subtotal} />
        <button disabled={!p.cart.length} onClick={p.onProceed}
          className="mt-4 flex h-20 w-full items-center justify-center gap-3 rounded-2xl border-4 border-primary-foreground bg-primary font-display text-3xl uppercase text-primary-foreground transition active:translate-y-1 disabled:opacity-40">
          Proceed <ArrowRight className="size-8" />
        </button>
      </div>
    </>
  );
}

function CartList({ cart, onQty, onRemove, big }: { cart: CartLine[]; onQty: (k: string, d: number) => void; onRemove: (k: string) => void; big?: boolean }) {
  if (!cart.length) return <p className="py-10 text-center text-2xl text-muted-foreground">Your cart is empty.</p>;
  return (
    <ul className="divide-y divide-border">
      {cart.map((l) => {
        const item = MENU.find((m) => m.id === l.itemId);
        return (
          <li key={l.key} className="flex items-center gap-3 py-4">
            {item && <FoodImage item={item} className={`${big ? "size-12 sm:size-24" : "size-12 sm:size-16"} shrink-0 rounded-xl`} />}
            <div className="min-w-0 flex-1">
              <div className={`${big ? "text-lg sm:text-2xl" : "text-base sm:text-lg"} break-words font-extrabold leading-tight`}>{l.name}</div>
              <div className="text-base text-muted-foreground">{l.size || "Regular"} · {rupee(l.price)}</div>
              <div className="mt-2 flex items-center gap-3">
                <QtyBtn small onClick={() => onQty(l.key, -1)} label="Decrease"><Minus className="size-5" /></QtyBtn>
                <span className="w-8 text-center text-2xl font-extrabold">{l.qty}</span>
                <QtyBtn small onClick={() => onQty(l.key, 1)} label="Increase"><Plus className="size-5" /></QtyBtn>
                <button onClick={() => onRemove(l.key)} aria-label={`Remove ${l.name}`} className="ml-auto grid size-12 place-items-center rounded-full text-destructive active:bg-destructive/20"><Trash2 className="size-6" /></button>
              </div>
            </div>
            <div className={`${big ? "text-xl sm:text-3xl" : "text-lg sm:text-xl"} shrink-0 font-display text-primary`}>{rupee(l.price * l.qty)}</div>
          </li>
        );
      })}
    </ul>
  );
}

function Totals({ subtotal }: { subtotal: number }) {
  return (
    <div className="space-y-1 pt-2">
      <div className="flex justify-between text-xl text-muted-foreground"><span>Subtotal</span><span>{rupee(subtotal)}</span></div>
      <div className="flex justify-between font-display text-4xl uppercase"><span>Total</span><span className="text-primary">{rupee(subtotal)}</span></div>
    </div>
  );
}

/* ---------------- Confirmation ---------------- */
function statusText(s: NotifyResult["email"]) {
  return s === "sent" ? "sent ✓" : s === "failed" ? "failed — please tell staff" : "not set up yet";
}

function Confirmation({ order, notify, onNew }: { order: Order; notify: NotifyResult | null; onNew: () => void }) {
  const waLink = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(orderText(order))}`;
  const kitchenAlerted = notify && (notify.email === "sent" || notify.whatsapp === "sent");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
      <div className="grid size-28 place-items-center rounded-full border-4 border-primary-foreground bg-primary glow"><Check className="size-16 text-primary-foreground" strokeWidth={4} /></div>
      <h1 className="mt-6 font-display text-6xl uppercase text-primary sm:text-7xl">Order Confirmed</h1>
      <p className="mt-2 text-2xl">Thank you for ordering from <span className="font-marker text-primary">MYNUS 360</span></p>
      <div className="mt-8 w-full max-w-lg rounded-3xl border-2 border-border bg-card p-8">
        <div className="text-lg uppercase tracking-widest text-muted-foreground">Order Number</div>
        <div className="font-display text-4xl sm:text-6xl break-words text-primary">#{order.number}</div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-left text-xl">
          <div><div className="text-muted-foreground">Order Type</div><div className="font-bold">{order.type}{order.table ? ` · Table ${order.table}` : ""}</div></div>
          <div><div className="text-muted-foreground">Total</div><div className="font-display text-3xl">{rupee(order.total)}</div></div>
          <div><div className="text-muted-foreground">Payment</div><div className="font-bold">{order.payment} — pay at counter</div></div>
        </div>
      </div>
      <p className="mt-6 text-2xl font-semibold">
        {kitchenAlerted ? "Your order has been sent to the kitchen." : "Please show this order number at the counter."}
      </p>
      {notify && (
        <p className="mt-2 text-base text-muted-foreground">Owner email: {statusText(notify.email)} · WhatsApp: {statusText(notify.whatsapp)}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button onClick={() => window.print()} className="inline-flex h-16 items-center gap-3 rounded-2xl border-2 border-border bg-card px-8 text-xl font-bold active:bg-secondary"><Printer className="size-7" />Print Receipt</button>
        {notify?.whatsapp !== "sent" && (
          <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex h-16 items-center gap-3 rounded-2xl border-2 border-border bg-card px-8 text-xl font-bold active:bg-secondary">Send on WhatsApp</a>
        )}
        <button onClick={onNew} className="inline-flex h-16 items-center gap-3 rounded-2xl border-4 border-primary-foreground bg-primary px-10 font-display text-2xl uppercase text-primary-foreground">Start New Order</button>
      </div>
    </div>
  );
}

function Receipt({ order }: { order: Order }) {
  return (
    <div className="receipt">
      <div style={{ textAlign: "center" }}>
        <strong style={{ fontSize: 18 }}>MYNUS 360</strong><br />GOOD FOOD • GREAT MOOD<br />Mitha Bazar, Jalandhar
      </div>
      <hr />
      <div>Order: #{order.number}</div>
      <div>Date: {new Date(order.createdAt).toLocaleString("en-IN")}</div>
      <div>Type: {order.type}{order.table ? ` · Table ${order.table}` : ""}</div>
      {order.customerName && <div>Name: {order.customerName}</div>}
      <hr />
      {order.lines.map((l) => (
        <div key={l.key} style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{l.qty} × {l.name}{l.size ? ` (${l.size})` : ""}</span><span>₹{l.price * l.qty}</span>
        </div>
      ))}
      <hr />
      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>₹{order.subtotal}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Total</span><span>₹{order.total}</span></div>
      <div>Payment: {order.payment}</div>
      <hr /><div style={{ textAlign: "center" }}>Thank you!</div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */
function Shell({ title, subtitle, onBack, backLabel = "Back", children }: { title: string; subtitle?: string; onBack: () => void; backLabel?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="inline-flex h-14 items-center gap-2 rounded-full border-2 border-border bg-card px-6 text-lg font-bold active:bg-secondary"><ArrowLeft className="size-6" />{backLabel}</button>
        <img src={LOGO_URL} alt="MYNUS 360" className="ml-auto size-16 rounded-full object-contain" />
      </div>
      <h1 className="font-display text-4xl break-words uppercase leading-tight text-primary sm:text-6xl">{title}</h1>
      {subtitle && <p className="mt-2 text-xl text-muted-foreground">{subtitle}</p>}
      <div className="mt-8 flex-1">{children}</div>
    </div>
  );
}

function BigButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Button onClick={onClick} disabled={disabled}
      className="mt-8 flex min-h-20 h-auto w-full whitespace-normal py-4 items-center justify-center gap-3 rounded-3xl border-4 border-primary-foreground bg-primary font-display text-2xl sm:text-4xl uppercase text-primary-foreground shadow-[0_6px_0_var(--color-primary-foreground)] transition active:translate-y-1 active:shadow-none disabled:opacity-40">
      {children}
    </Button>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button onClick={onClick}
      className={`h-28 sm:h-40 whitespace-normal rounded-3xl border-4 font-display text-3xl sm:text-5xl uppercase transition ${active ? "border-primary-foreground bg-primary text-primary-foreground glow" : "border-border bg-card active:bg-secondary"}`}>
      {children}
    </Button>
  );
}

function QtyBtn({ onClick, label, children, small }: { onClick: () => void; label: string; children: React.ReactNode; small?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`${small ? "size-12" : "size-16"} grid place-items-center rounded-full border-2 border-primary bg-background text-primary active:bg-primary active:text-primary-foreground`}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; inputMode?: "tel" }) {
  return (
    <label className="block">
      <span className="text-xl font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        className="mt-2 h-20 w-full rounded-2xl border-2 border-border bg-card px-6 text-2xl outline-none focus:border-primary" />
    </label>
  );
}
