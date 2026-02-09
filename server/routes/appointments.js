import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取所有预约
router.get('/', async (req, res) => {
    try {
        const { date } = req.query;

        let query = supabase
            .from('appointments')
            .select('*');

        if (date) {
            // 筛选指定日期的预约
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query
                .gte('appointment_time', startOfDay)
                .lte('appointment_time', endOfDay);
        }

        const { data, error } = await query.order('appointment_time', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新预约
router.post('/', async (req, res) => {
    try {
        const appointmentData = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .insert([appointmentData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新预约
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 删除预约
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '预约已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
