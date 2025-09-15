import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { backend_Url, formatCurrency } from '../App';
import { toast } from 'react-toastify';

// ===== Chart color theme (2-color gradient) =====
const chartGradient = {
    start: '#f6d365 ', // cyan-500
    end: '#fda085',   // blue-500
};

const hexToRgb = (hex) => {
    const s = hex.replace('#','');
    const bigint = parseInt(s, 16);
    const r = (s.length === 3) ? (bigint >> 8 & 0xF) * 17 : (bigint >> 16) & 255;
    const g = (s.length === 3) ? (bigint >> 4 & 0xF) * 17 : (bigint >> 8) & 255;
    const b = (s.length === 3) ? (bigint & 0xF) * 17 : bigint & 255;
    return { r, g, b };
};

const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(v => {
    const h = Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return h;
}).join('');

const mixColor = (hex1, hex2, t) => {
    const a = hexToRgb(hex1); const b = hexToRgb(hex2);
    return rgbToHex({
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
    });
};

const buildGradientPalette = (n, start, end) => {
    if (n <= 1) return [start];
    return Array.from({ length: n }, (_, i) => mixColor(start, end, i / (n - 1)));
};

// Auto-fit bar chart with rotated labels, no scroll
const BarChart = ({ data, height = 180 }) => {
    const max = Math.max(1, ...data.map(d => d.value));
    const barCount = data.length;

    // Measure container width to fit all bars without horizontal scroll
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width || 0);
            }
        });
        ro.observe(el);
        // Initialize width immediately
        setContainerWidth(el.getBoundingClientRect().width || 0);
        return () => ro.disconnect();
    }, []);

    // Dynamic gap based on number of bars
    const gap = barCount > 28 ? 2 : barCount > 18 ? 4 : 6;
    const totalGap = Math.max(0, barCount - 1) * gap;
    const available = Math.max(0, containerWidth - totalGap);
    const computedWidth = barCount > 0 ? Math.floor(available / barCount) : 0;
    const barWidth = Math.max(6, Math.min(28, computedWidth || 12));

    return (
        <div ref={containerRef} className="w-full">
            {/* Bars row */}
            <div className="flex items-end border-b border-gray-200" style={{ height: height, columnGap: gap }}>
                {data.map((d, idx) => {
                    const h = Math.round((d.value / max) * (height - 4));
                    return (
                        <div key={idx} className="flex flex-col items-center" style={{ width: barWidth }}>
                            <div
                                className="transition-all w-full rounded-t hover:opacity-90"
                                style={{
                                    height: `${h}px`,
                                    backgroundImage: `linear-gradient(180deg, ${chartGradient.start}, ${chartGradient.end})`
                                }}
                                title={`${d.label}: ${formatCurrency(d.value)}`}
                            />
                        </div>
                    );
                })}
            </div>
            {/* Labels row, rotated for clarity */}
            <div className="flex mt-2 overflow-hidden" style={{ columnGap: gap }}>
                {data.map((d, idx) => (
                    <div key={idx} className="flex justify-center" style={{ width: barWidth, maxWidth: barWidth }}>
                        <span
                            className="text-[10px] text-gray-500 select-none block overflow-hidden"
                            style={{
                                transform: 'none', // Always straight
                                whiteSpace: 'nowrap',
                                width: barWidth,
                                maxWidth: barWidth,
                                textAlign: 'center',
                                display: 'inline-block',
                                overflow: 'hidden',
                            }}
                        >
                            {d.label}
                        </span>
                    </div>
                ))}
            </div>

        </div>
    );
};

// Simple donut chart using conic-gradient
const Donut = ({ segments }) => {
    // segments: [{ label, value, color }]
    const total = Math.max(1, segments.reduce((s, x) => s += x.value, 0));
    let current = 0;
    const gradient = segments.map(seg => {
        const start = (current / total) * 360;
        current += seg.value;
        const end = (current / total) * 360;
        return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');

    return (
        <div className="flex items-center gap-4">
            <div className="w-40 h-40 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
                <div className="w-20 h-20 bg-white rounded-full m-10" />
            </div>
            <div className="grid gap-2 text-sm">
                {segments.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded" style={{ background: s.color }} />
                        <span className="text-gray-700">{s.label}</span>
                        <span className="text-gray-500">{s.value} ({Math.round((s.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const getMonthOptions = (orders) => {
    // Get all months/years present in orders
    const set = new Set();
    orders.forEach(o => {
        const d = new Date(o.date);
        set.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    });
    // Sort descending
    return Array.from(set).sort((a, b) => b.localeCompare(a));
};

const Dashboard = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
    });

    const fetchAllOrders = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await axios.post(backend_Url + '/api/order/list', {}, { headers: { token } });
            if (res.data.success) setOrders(res.data.orders || []);
            else toast.error(res.data.message || 'Không tải được dữ liệu đơn hàng');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllOrders(); }, [token]);

    // Month options
    const monthOptions = useMemo(() => getMonthOptions(orders), [orders]);
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const inSelectedMonth = (dt) => {
        const d = new Date(dt);
        return d >= startOfMonth && d <= endOfMonth;
    };

    // Aggregations
    const {
        monthlyPaidRevenue,
        monthlyGMV,
        monthlyOrdersCount,
        paidCount,
        unpaidCount,
        avgOrderValue,
        dailyRevenue,
        methodSegments,
        topProducts,
        topAllProducts,
        recentOrders
    } = useMemo(() => {
        const monthOrders = orders.filter(o => inSelectedMonth(o.date));
        const paid = monthOrders.filter(o => o.payment);
        const unpaid = monthOrders.filter(o => !o.payment);

        const sum = (arr, sel) => arr.reduce((s, x) => s + (sel ? sel(x) : x), 0);

        const monthlyPaidRevenue = sum(paid, o => o.amount || 0);
        const monthlyGMV = sum(monthOrders, o => o.amount || 0);
        const monthlyOrdersCount = monthOrders.length;
        const paidCount = paid.length;
        const unpaidCount = unpaid.length;
        const avgOrderValue = monthlyOrdersCount ? Math.round(monthlyPaidRevenue / Math.max(1, paidCount)) : 0;

        // daily revenue (paid only)
        const daysInMonth = endOfMonth.getDate();
        const dailyMap = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, value: 0 }));
        paid.forEach(o => {
            const d = new Date(o.date).getDate();
            const idx = d - 1;
            if (idx >= 0 && idx < dailyMap.length) dailyMap[idx].value += (o.amount || 0);
        });
        const dailyRevenue = dailyMap.map(d => ({ label: d.day.toString(), value: d.value }));

        // payment methods breakdown (this month, count of orders)
        const byMethod = monthOrders.reduce((m, o) => {
            const k = o.paymentMethod || 'Khác';
            m[k] = (m[k] || 0) + 1;
            return m;
        }, {});
        const entries = Object.entries(byMethod);
        const palette = buildGradientPalette(entries.length, chartGradient.start, chartGradient.end);
        const methodSegments = entries.map(([label, value], i) => ({ label, value, color: palette[i] }));

        // top products (by quantity) — use items from orders (fallback to products if present)
        const prodMap = {};
        monthOrders.forEach(o => {
            const lineItems = Array.isArray(o.items) ? o.items : (Array.isArray(o.products) ? o.products : []);
            lineItems.forEach(p => {
                const qty = Number(p.quantity ?? p.qty ?? 0);
                if (!qty) return;
                const name = p.name || p.productName || 'Sản phẩm';
                const size = p.size || '';
                const key = `${name}__${size}`;
                if (!prodMap[key]) prodMap[key] = { name, size, qty: 0 };
                prodMap[key].qty += qty;
            });
        });
        const topProducts = Object.values(prodMap)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 6);

        // top customers (by total amount in selected month)
        const custMap = {};
        monthOrders.forEach(o => {
            const name = `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.trim() || 'Khách lẻ';
            if (!custMap[name]) custMap[name] = { name, amount: 0, count: 0 };
            custMap[name].amount += (o.amount || 0);
            custMap[name].count += 1;
        });
        const topCustomers = Object.values(custMap)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);

        // all-time top products across all orders (dedupe by product, ignore size)
        const allProdMap = {};
        orders.forEach(o => {
            const lineItems = Array.isArray(o.items) ? o.items : (Array.isArray(o.products) ? o.products : []);
            lineItems.forEach(p => {
                const qty = Number(p.quantity ?? p.qty ?? 0);
                if (!qty) return;
                const displayName = p.name || p.productName || 'Sản phẩm';
                const idOrName = p._id || p.productId || p.id || (displayName.trim().toLowerCase());
                const key = String(idOrName);
                if (!allProdMap[key]) allProdMap[key] = { id: idOrName, name: displayName, qty: 0 };
                allProdMap[key].qty += qty;
            });
        });
        const topAllProducts = Object.values(allProdMap)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 6);

        // recent orders
        const recentOrders = monthOrders.slice(-6).reverse();

        return {
            monthlyPaidRevenue,
            monthlyGMV,
            monthlyOrdersCount,
            paidCount,
            unpaidCount,
            avgOrderValue,
            dailyRevenue,
            methodSegments,
            topProducts,
            topAllProducts,
            recentOrders
        };
    }, [orders, selectedMonth]);
    return (
        <div className="p-2 sm:p-4 md:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">DASHBOARD</h2>
            <div className="mb-4 flex gap-2 items-center flex-wrap">
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border rounded px-2 py-1">
                    {monthOptions.map(opt => <option key={opt} value={opt}>{opt.replace('-', '/')}</option>)}
                </select>
                <span className="text-gray-500">Chọn tháng</span>
            </div>
            {monthlyOrdersCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-3xl text-gray-400 mb-4">Không có dữ liệu đơn hàng trong tháng này</div>
                    <div className="text-gray-500">Hãy chọn tháng khác hoặc kiểm tra lại dữ liệu.</div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
                        <div className="bg-white rounded shadow p-2 sm:p-4 flex flex-col items-center">
                            <div className="text-base sm:text-lg font-bold">{formatCurrency(monthlyPaidRevenue)}</div>
                            <div className="text-gray-500 text-xs sm:text-sm">Doanh thu đã thanh toán</div>
                        </div>
                        <div className="bg-white rounded shadow p-2 sm:p-4 flex flex-col items-center">
                            <div className="text-base sm:text-lg font-bold">{formatCurrency(monthlyGMV)}</div>
                            <div className="text-gray-500 text-xs sm:text-sm">Tổng giá trị đơn hàng</div>
                        </div>
                        <div className="bg-white rounded shadow p-2 sm:p-4 flex flex-col items-center">
                            <div className="text-base sm:text-lg font-bold">{monthlyOrdersCount}</div>
                            <div className="text-gray-500 text-xs sm:text-sm">Số đơn hàng</div>
                        </div>
                        <div className="bg-white rounded shadow p-2 sm:p-4 flex flex-col items-center">
                            <div className="text-base sm:text-lg font-bold">{formatCurrency(avgOrderValue)}</div>
                            <div className="text-gray-500 text-xs sm:text-sm">Giá trị trung bình/đơn</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded shadow p-2 sm:p-4">
                            <div className="font-semibold mb-2">Doanh thu theo ngày</div>
                            <BarChart data={dailyRevenue} />
                            {dailyRevenue.every(d => d.value === 0) && (
                                <div className="text-gray-400 text-xs mt-2">Chưa có doanh thu nào trong tháng này</div>
                            )}
                        </div>
                        <div className="bg-white rounded shadow p-2 sm:p-4 flex flex-col items-center justify-center">
                            <div className="font-semibold mb-2">Tỉ lệ phương thức thanh toán</div>
                            <Donut segments={methodSegments} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                        <div className="bg-white rounded shadow p-2 sm:p-4">
                            <div className="font-semibold mb-2">Top sản phẩm được mua nhiều nhất</div>
                            {topAllProducts.length === 0 ? (
                                <div className="text-gray-400 text-sm py-2">Chưa có dữ liệu</div>
                            ) : (
                                <ul className="text-xs sm:text-sm">
                                    {topAllProducts.map((p, i) => (
                                        <li key={i} className="flex justify-between items-center py-1 border-b last:border-b-0">
                                            <span>{p.name}</span>
                                            <span className="text-gray-500">{p.qty} sp</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white rounded shadow p-2 sm:p-4">
                            <div className="font-semibold mb-2">Đơn hàng gần đây</div>
                            {recentOrders.length === 0 ? (
                                <div className="text-gray-400 text-sm py-2">Chưa có dữ liệu đơn hàng gần đây</div>
                            ) : (
                                <ul className="text-xs sm:text-sm">
                                    {recentOrders.map((o, i) => (
                                        <li key={i} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b last:border-b-0 gap-1">
                                            <div>
                                                <span className="font-medium mr-2">{new Date(o.date).toLocaleString('vi-VN')}</span>
                                                <span className="text-gray-500 mr-2">{(o.address?.firstName || '') + ' ' + (o.address?.lastName || '')}</span>
                                                <span className={`text-xs px-2 py-1 rounded ${o.payment ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{o.payment ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                                            </div>
                                            <div className="text-right font-semibold text-gray-500">{formatCurrency(o.amount)}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
