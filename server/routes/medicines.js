import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取所有医疗物资
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('medicines')
            .select('*');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('expiry_date', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新物资
router.post('/', async (req, res) => {
    try {
        const medicineData = req.body;

        // 计算状态
        const today = new Date();
        const expiryDate = new Date(medicineData.expiry_date);
        const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        let status = 'normal';
        if (diffDays < 0) {
            status = 'expired';
        } else if (diffDays < 90) {
            status = 'warning';
        }

        const { data, error } = await supabase
            .from('medicines')
            .insert([{ ...medicineData, status }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新物资
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // 如果更新了过期日期，重新计算状态
        if (updates.expiry_date) {
            const today = new Date();
            const expiryDate = new Date(updates.expiry_date);
            const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            let status = 'normal';
            if (diffDays < 0) {
                status = 'expired';
            } else if (diffDays < 90) {
                status = 'warning';
            }
            updates.status = status;
        }

        const { data, error } = await supabase
            .from('medicines')
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

// 删除物资
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('medicines')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '物资已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
