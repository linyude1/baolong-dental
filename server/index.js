import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import patientsRouter from './routes/patients.js';
import treatmentsRouter from './routes/treatments.js';
import appointmentsRouter from './routes/appointments.js';
import medicinesRouter from './routes/medicines.js';
import shoppingRouter from './routes/shopping.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API路由
app.use('/api/patients', patientsRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/medicines', medicinesRouter);
app.use('/api/shopping', shoppingRouter);

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '宝龙口腔API服务运行正常' });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '宝龙口腔管理系统 API',
        version: '1.0.0',
        endpoints: {
            patients: '/api/patients',
            treatments: '/api/treatments',
            appointments: '/api/appointments',
            medicines: '/api/medicines',
            shopping: '/api/shopping'
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '未找到该API端点'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 宝龙口腔API服务器运行在 http://localhost:${PORT}`);
    console.log(`📋 API文档: http://localhost:${PORT}/`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});
