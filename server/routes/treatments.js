import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取患者的所有诊疗记录
router.get('/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;

        const { data, error } = await supabase
            .from('treatment_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('visit_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新诊疗记录
router.post('/', async (req, res) => {
    try {
        const recordData = req.body;

        const { data, error } = await supabase
            .from('treatment_records')
            .insert([recordData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新诊疗记录
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('treatment_records')
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

// 删除诊疗记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('treatment_records')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '诊疗记录已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取指定日期范围的诊疗记录
router.get('/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = supabase
            .from('treatment_records')
            .select('*, patients(name, phone, avatar)');

        if (startDate) {
            query = query.gte('visit_date', startDate);
        }
        if (endDate) {
            query = query.lte('visit_date', endDate);
        }

        const { data, error } = await query.order('visit_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
