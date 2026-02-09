import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// 获取所有采购项
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .order('added_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新采购项
router.post('/', async (req, res) => {
    try {
        const itemData = req.body;

        const { data, error } = await supabase
            .from('shopping_items')
            .insert([itemData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新采购项（主要用于标记已购买）
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('shopping_items')
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

// 删除采购项
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('shopping_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: '采购项已删除' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 批量标记已购买
router.post('/batch-bought', async (req, res) => {
    try {
        const { ids } = req.body;

        const { data, error } = await supabase
            .from('shopping_items')
            .update({ is_bought: true })
            .in('id', ids)
            .select();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
